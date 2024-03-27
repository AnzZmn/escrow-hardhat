const express = require('express');
const cors = require('cors'); // Include CORS

const app = express();
const port = 3042;

app.use(cors()); // Use CORS
app.use(express.json());

let contracts = ["0x32953Ba38288F7aabe0f98693BA20E6E8595BE38","0x6104bFaaFc61678429bA04788Af4e69a57a47773"];

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
