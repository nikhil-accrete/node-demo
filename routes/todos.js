const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// GET /api/todos - Get all todos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        t.id, 
        t.title, 
        t.completed, 
        t.created_at,
        t.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM todos t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC
    `);
    
    res.json({ 
      success: true, 
      data: rows, 
      count: rows.length 
    });
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch todos',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// POST /api/todos - Create new todo
router.post('/', async (req, res) => {
  try {
    const { title, user_id } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO todos (title, user_id) VALUES (?, ?)',
      [title, user_id || null]
    );

    const [newTodo] = await pool.execute(`
      SELECT 
        t.id, 
        t.title, 
        t.completed, 
        t.created_at,
        t.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM todos t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `, [result.insertId]);

    res.status(201).json({ 
      success: true, 
      data: newTodo[0], 
      message: 'Todo created successfully' 
    });
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create todo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// PUT /api/todos/:id - Update todo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;
    
    // Check if todo exists
    const [existingTodo] = await pool.execute(
      'SELECT id FROM todos WHERE id = ?',
      [id]
    );
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Todo not found' 
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (completed !== undefined) {
      updates.push('completed = ?');
      values.push(completed);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }
    
    values.push(id);
    
    await pool.execute(
      `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Get updated todo
    const [updatedTodo] = await pool.execute(`
      SELECT 
        t.id, 
        t.title, 
        t.completed, 
        t.created_at,
        t.updated_at,
        u.name as user_name,
        u.id as user_id
      FROM todos t 
      LEFT JOIN users u ON t.user_id = u.id 
      WHERE t.id = ?
    `, [id]);
    
    res.json({ 
      success: true, 
      data: updatedTodo[0], 
      message: 'Todo updated successfully' 
    });
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update todo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// DELETE /api/todos/:id - Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if todo exists
    const [existingTodo] = await pool.execute(
      'SELECT id, title FROM todos WHERE id = ?',
      [id]
    );
    
    if (existingTodo.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Todo not found' 
      });
    }
    
    await pool.execute('DELETE FROM todos WHERE id = ?', [id]);
    
    res.json({ 
      success: true, 
      data: existingTodo[0], 
      message: 'Todo deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete todo',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Database error'
    });
  }
});

// Export todos for stats (for backward compatibility)
router.__getTodos = async () => {
  try {
    const [rows] = await pool.execute('SELECT * FROM todos');
    return rows;
  } catch (error) {
    console.error('Error fetching todos for stats:', error);
    return [];
  }
};

module.exports = router;