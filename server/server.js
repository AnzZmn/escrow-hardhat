const express = require('express');
const cors = require('cors'); // Include CORS

const app = express();
const port = 3042;

app.use(cors()); // Use CORS
app.use(express.json());

let contracts = [];

// Define a route handler for the default home page
app.get('/data', (req, res) => {
    res.send(contracts);
  });

  app.post('/data', (req, res) => {
    const { contractAddress } = req.body; // Destructuring to extract contractAddress
    contracts.push(contractAddress);
    res.status(200).send('Contract address added');
});

// Start the server on the specified port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
