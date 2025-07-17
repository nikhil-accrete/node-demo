const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({ 
      success: true, 
      data: rows, 
      count: rows.length 
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// POST /api/users - Create new user
router.post('/', async (req, res) => {
  try {
    const { name, email, role = 'user' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
      [name, email, role]
    );

    const [newUser] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ 
      success: true, 
      data: newUser[0], 
      message: 'User created successfully' 
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [rows] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: rows[0] 
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated user
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
      [id]
    );
    
    res.json({ 
      success: true, 
      data: updatedUser[0], 
      message: 'User updated successfully' 
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const [existingUser] = await pool.execute(
      'SELECT id, name FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUser.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      data: existingUser[0], 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

module.exports = router;