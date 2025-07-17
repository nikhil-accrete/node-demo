const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const todosRouter = require('./routes/todos');
const usersRouter = require('./routes/users');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Node.js API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/todos',
      'POST /api/todos',
      'PUT /api/todos/:id',
      'DELETE /api/todos/:id',
      'GET /api/users',
      'GET /api/stats',
    ],
  });
});

app.use('/api/todos', todosRouter);
app.use('/api/users', usersRouter);

app.get('/api/stats', (req, res) => {
  const completedTodos = todosRouter.__todos?.filter((todo) => todo.completed).length ?? 0;
  const pendingTodos = todosRouter.__todos?.filter((todo) => !todo.completed).length ?? 0;

  res.json({
    success: true,
    data: {
      totalTodos: completedTodos + pendingTodos,
      completedTodos,
      pendingTodos,
      totalUsers: 2,
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = app;
