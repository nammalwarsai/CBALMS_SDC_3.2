const express = require('express');
const router = express.Router();

router.post('/password', (req, res) => {
  res.send('Password route working');
});

module.exports = router;
