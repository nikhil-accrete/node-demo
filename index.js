const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database configuration
const { testConnection, initializeTables } = require('./config/database');

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
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    database: dbConnected ? 'Connected' : 'Disconnected'
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Node.js API with MySQL',
    version: '1.0.0',
    endpoints: [
      'GET /api/health',
      'GET /api/todos',
      'POST /api/todos',
      'PUT /api/todos/:id',
      'DELETE /api/todos/:id',
      'GET /api/users',
      'POST /api/users',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      'GET /api/stats',
    ],
  });
});

app.use('/api/todos', todosRouter);
app.use('/api/users', usersRouter);

// Updated stats endpoint to use database
app.get('/api/stats', async (req, res) => {
  try {
    const { pool } = require('./config/database');
    
    // Get todo stats
    const [todoStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
      FROM todos
    `);
    
    // Get user count
    const [userStats] = await pool.execute('SELECT COUNT(*) as total FROM users');
    
    const stats = todoStats[0];
    const userCount = userStats[0].total;

    res.json({
      success: true,
      data: {
        totalTodos: stats.total,
        completedTodos: stats.completed,
        pendingTodos: stats.pending,
        totalUsers: userCount,
        serverUptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
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

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }
    
    // Initialize database tables
    await initializeTables();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: MySQL`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;