const pool = require('../config/db');

const getAllTasks = async (req, res) => {
  try {
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE created_by = ? OR assigned_to = ?',
      [req.userId, req.userId]
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assigned_to, priority, due_date } = req.body;
    
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, project_id, created_by, assigned_to, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, project_id, req.userId, assigned_to, priority, due_date]
    );
    
    const [task] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(task[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assigned_to, priority, due_date, status } = req.body;
    
    // Check if user owns the task or is assigned to it
    const [existingTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)',
      [id, req.userId, req.userId]
    );
    
    if (existingTask.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    
    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?, status = ? WHERE id = ?',
      [title, description, assigned_to, priority, due_date, status, id]
    );
    
    const [updatedTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    );
    
    res.json(updatedTask[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns the task
    const [existingTask] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND created_by = ?',
      [id, req.userId]
    );
    
    if (existingTask.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    
    await pool.query('DELETE FROM tasks WHERE id = ?', [id]);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask
};
