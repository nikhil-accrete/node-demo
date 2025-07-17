// routes/todos.js
const express = require('express');
const router = express.Router();

let todos = [
  { id: 1, title: 'Learn Node.js', completed: false, createdAt: new Date() },
  { id: 2, title: 'Build React App', completed: false, createdAt: new Date() },
  { id: 3, title: 'Deploy to AWS', completed: true, createdAt: new Date() },
];

router.get('/', (req, res) => {
  res.json({ success: true, data: todos, count: todos.length });
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }

  const newTodo = {
    id: todos.length + 1,
    title,
    completed: false,
    createdAt: new Date(),
  };

  todos.push(newTodo);

  res.status(201).json({ success: true, data: newTodo, message: 'Todo created successfully' });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const todoIndex = todos.findIndex((todo) => todo.id === parseInt(id));
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }

  if (title) todos[todoIndex].title = title;
  if (completed !== undefined) todos[todoIndex].completed = completed;

  res.json({ success: true, data: todos[todoIndex], message: 'Todo updated successfully' });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const todoIndex = todos.findIndex((todo) => todo.id === parseInt(id));
  if (todoIndex === -1) {
    return res.status(404).json({ success: false, message: 'Todo not found' });
  }

  const deletedTodo = todos.splice(todoIndex, 1)[0];
  res.json({ success: true, data: deletedTodo, message: 'Todo deleted successfully' });
});

module.exports = router;
