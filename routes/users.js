// routes/users.js
const express = require('express');
const router = express.Router();

const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
];

router.get('/', (req, res) => {
  res.json({ success: true, data: users, count: users.length });
});

module.exports = router;
