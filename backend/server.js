const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send(`Backend is running on port ${PORT}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
