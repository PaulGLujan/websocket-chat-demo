# WebSocket Chat Demo

This project is a simple, real-time chat application designed to provide a hands-on learning experience with **WebSocket technology** and its **serverless deployment** in a cloud environment using AWS.

## Key Features

The application aims to implement the following core features:

1.  **Real-time Bi-directional Communication:** Users connected to the chat application can send messages that are instantly broadcast to all other active participants. This demonstrates the simultaneous two-way communication of WebSockets and creates an immediate, interactive experience.
2.  **Scalable Cloud Deployment (AWS):** The chat's backend is powered by Amazon Web Services (AWS) using **API Gateway's WebSocket APIs** and **AWS Lambda functions**. This showcases a modern, event-driven, and highly scalable architecture that eliminates server management overhead.
3. **Connection Management with DynamoDB:** Active WebSocket connections are efficiently managed and persisted in an **Amazon DynamoDB** table. This allows the stateless Lambda functions to track connected clients and broadcast messages reliably to all participants.
4. **Static Frontend Hosting (AWS S3):** The client-side application (HTML, CSS, JavaScript) is hosted as a **static website on Amazon S3**. This ensures cost-effective, high-availability, and global distribution of your chat interface.

## Technologies Used

* **Frontend:**
    * **HTML, CSS:** For structuring and styling the user interface.
    * **TypeScript:** For writing robust and maintainable client-side logic, compiled to JavaScript for browser execution.
* **Backend (Serverless on AWS):**
    * **AWS Lambda:** Executes the backend logic for connecting, disconnecting, and sending messages.
    * **AWS API Gateway (WebSocket API):** Manages the persistent WebSocket connections and routes messages to the appropriate Lambda functions.
    * **Amazon DynamoDB:** A NoSQL database used to store and retrieve active WebSocket connection IDs, enabling message broadcasting across clients.
    * **AWS SDK for JavaScript:** Used within Lambda functions to interact with DynamoDB and the API Gateway Management API.
* **Local Development**:
    * **Node.js:** JavaScript runtime environment.
    * **Express.js:** A minimal web framework used locally to serve the static frontend files during development.
* **Tooling & Deployment:**
    * **Serverless Framework:** An open-source framework used to define, deploy, and manage the serverless application resources on AWS (Lambdas, API Gateway, DynamoDB, S3).
    * `serverless-s3-sync` **Plugin:** A Serverless Framework plugin used to sync local frontend files to the S3 bucket during deployment.

## Getting Started

Follow these steps to set up, run, and deploy your WebSocket Chat Demo.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (LTS version recommended)
    *   **NVM (Node Version Manager):** Highly recommended for managing Node.js versions. If using NVM, simply run `nvm use` in the project root to switch to the recommended Node.js version defined in `.nvmrc`.
*   **npm** (comes with Node.js)
*   **AWS CLI:** Configured with credentials that have permissions to create and manage Lambda functions, API Gateway WebSocket APIs, DynamoDB tables, and S3 buckets (e.g., `AdministratorAccess` for personal demo purposes).
    *   If you need to configure your AWS CLI, run `aws configure` in your terminal and follow the prompts.
*   **Serverless Framework CLI:**
    
        npm install -g serverless
    *   **Note for Serverless v4:** If this is your first time using Serverless Framework v4, you may be prompted to log in/register. Follow the CLI instructions to complete this step.

### Local Setup & Development

1.  **Clone the Repository:**
    
        git clone https://github.com/PaulGLujan/websocket-chat-demo.git
        cd websocket-chat-demo
    
2.  **Install Dependencies:**
    
        npm install
    
3.  **Compile Client-Side Code:** The frontend (browser) code needs to be compiled to JavaScript.
    
        npm run build:client
    
4.  **Run Local Frontend Server:** To serve the `index.html` and `client.js` locally, you need a simple static file server.
    
        npm run start:frontend
    Leave this terminal window open.
5.  **Open in Browser:** Open your web browser and navigate to `http://localhost:3000`. You should see the chat interface.

### Deployment to AWS

1.  **Review `serverless.yml`:** Open `serverless.yml` and ensure the `provider.region` is set to your preferred AWS region (e.g., `us-west-2`).
2.  **Compile Server-Side Code:** The Lambda functions code needs to be compiled.
    
        npm run build:server
    
3.  **Deploy the Stack:** This command will deploy your Lambda functions, API Gateway WebSocket API, DynamoDB table, and S3 static website to your AWS account.
    
        npm run deploy

    This process can take a few minutes. Upon successful completion, the Serverless Framework will output the `WebSocket` endpoint and (if configured) the `S3StaticWebsite` URL.
    *   **Important:** If the static website URL is not displayed in the console output, you can find it in the AWS S3 console by navigating to your frontend bucket (`websocket-chat-app-frontend-dev` in the chosen region), then checking its "Properties" tab under "Static website hosting".

### Testing the Deployed Application

1.  **Access the Frontend:** Open your web browser and navigate to the **S3 Static Website URL** you obtained from the deployment output or the AWS Console. This is your publicly accessible chat application.
2.  **Verify Real-time Communication:** Open multiple tabs or different browsers to this URL. Send messages from one tab and observe them appearing in all other connected tabs in real-time.
3.  **Monitor Logs (Optional but Recommended):** Check your AWS CloudWatch logs in the AWS Console for log groups related to your Lambda functions (e.g., `/aws/lambda/websocket-chat-app-dev-sendMessage`) to see backend activity and debug any issues.

### Cleaning Up AWS Resources

To avoid incurring future costs from deployed AWS resources, you can easily remove the entire stack using the Serverless Framework:

    serverless remove

This command will delete all the AWS resources that were created by the `serverless deploy` command.