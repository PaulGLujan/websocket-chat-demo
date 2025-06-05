import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';

// Initialize DynamoDB Document Client for easier interaction
const dbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dbClient);

// Get the DynamoDB table name from environment variables defined in serverless.yml
const connectionsTableName = process.env.CONNECTIONS_TABLE_NAME!;

// --- Lambda Handler for $connect Route ---
// Triggered when a new client establishes a WebSocket connection
export const connect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    console.log(`[CONNECT] New client connected: ${connectionId}`);

    try {
        await ddbDocClient.send(new PutCommand({
            TableName: connectionsTableName,
            Item: { connectionId } // Store the connectionId in DynamoDB
        }));
        return { statusCode: 200, body: 'Connected.' };
    } catch (error) {
        console.error('[CONNECT] Error saving connection:', error);
        return { statusCode: 500, body: 'Failed to connect.' };
    }
};

// --- Lambda Handler for $disconnect Route ---
// Triggered when a client disconnects from the WebSocket
export const disconnect = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const connectionId = event.requestContext.connectionId!;
    console.log(`[DISCONNECT] Client disconnected: ${connectionId}`);

    try {
        await ddbDocClient.send(new DeleteCommand({
            TableName: connectionsTableName,
            Key: { connectionId } // Remove the connectionId from DynamoDB
        }));
        return { statusCode: 200, body: 'Disconnected.' };
    } catch (error) {
        console.error('[DISCONNECT] Error deleting connection:', error);
        return { statusCode: 500, body: 'Failed to disconnect.' };
    }
};

// --- Lambda Handler for $default (sendMessage) Route ---
// Triggered when a client sends a message (not a connect/disconnect)
export const sendMessage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Ensure there's a message body
    if (!event.body) {
        console.warn('[SEND_MESSAGE] No message body received.');
        return { statusCode: 400, body: 'No message body.' };
    }

    let messageContent: string;
    try {
        // Parse the incoming message. Our client will send plain text for now.
        // In a real app, you'd parse JSON: const data = JSON.parse(event.body); messageContent = data.message;
        messageContent = event.body;
    } catch (e) {
        console.error('[SEND_MESSAGE] Error parsing message body:', e);
        return { statusCode: 400, body: 'Invalid message format.' };
    }

    const senderConnectionId = event.requestContext.connectionId!;
    console.log(`[SEND_MESSAGE] Received from ${senderConnectionId}: ${messageContent}`);

    let connectionData;
    try {
        // Retrieve all active connection IDs from DynamoDB
        connectionData = await ddbDocClient.send(new ScanCommand({
            TableName: connectionsTableName,
            ProjectionExpression: 'connectionId' // Only fetch the connectionId attribute
        }));
    } catch (error) {
        console.error('[SEND_MESSAGE] Error scanning connections from DynamoDB:', error);
        return { statusCode: 500, body: 'Failed to retrieve connections.' };
    }

    // Prepare the API Gateway Management API client.
    // The endpoint is crucial and constructed from event.requestContext.
    const endpoint = event.requestContext.domainName + '/' + event.requestContext.stage;
    const apigwManagementApi = new ApiGatewayManagementApiClient({
        apiVersion: '2018-11-29',
        endpoint: `https://${endpoint}`
    });

    // Create an array of promises for sending messages to all connected clients
    const postCalls = connectionData.Items!.map(async ({ connectionId }) => {
        // Do NOT send the message back to the sender
        if (connectionId === senderConnectionId) {
            // Optionally log that we're skipping the sender
            console.log(`[SEND_MESSAGE] Skipping sender: ${connectionId}`);
            return; // Skip this client
        }

        try {
            // Send message to each connected client
            await apigwManagementApi.send(new PostToConnectionCommand({
                ConnectionId: connectionId,
                Data: messageContent // Send the raw message content
            }));
            console.log(`[SEND_MESSAGE] Sent to: ${connectionId}`);
        } catch (e: any) {
            // Handle stale connections (e.g., client disconnected without sending $disconnect)
            if (e.statusCode === 410) { // GoneException
                console.warn(`[SEND_MESSAGE] Stale connection found and deleting: ${connectionId}`);
                await ddbDocClient.send(new DeleteCommand({
                    TableName: connectionsTableName,
                    Key: { connectionId }
                }));
            } else {
                console.error(`[SEND_MESSAGE] Failed to post to connection ${connectionId}:`, e);
            }
        }
    });

    try {
        // Wait for all messages to be sent
        await Promise.all(postCalls);
        return { statusCode: 200, body: 'Message sent.' };
    } catch (error) {
        console.error('[SEND_MESSAGE] Error during broadcast:', error);
        return { statusCode: 500, body: 'Failed to send messages.' };
    }
};