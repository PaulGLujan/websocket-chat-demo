const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Local frontend server running at http://localhost:${port}`);
    console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
});