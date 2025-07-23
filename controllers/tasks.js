const pool = require('../config/db');
const path = require('path');

const getAllTasks = async (req, res) => {
  try {
    const { status, assigned_to, project_id, due_from, due_to } = req.query;
    let query = `SELECT t.*, u.username as assigned_to_username FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id WHERE (t.created_by = ? OR t.assigned_to = ?)`;
    const params = [req.userId, req.userId];
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (assigned_to) {
      query += ' AND t.assigned_to = ?';
      params.push(assigned_to);
    }
    if (project_id) {
      query += ' AND t.project_id = ?';
      params.push(project_id);
    }
    if (due_from) {
      query += ' AND t.due_date >= ?';
      params.push(due_from);
    }
    if (due_to) {
      query += ' AND t.due_date <= ?';
      params.push(due_to);
    }
    const [tasks] = await pool.query(query, params);
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
    const [existingTaskArr] = await pool.query(
      'SELECT * FROM tasks WHERE id = ? AND (created_by = ? OR assigned_to = ?)',
      [id, req.userId, req.userId]
    );
    
    if (existingTaskArr.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    const existingTask = existingTaskArr[0];

    // Сравниваем поля и логируем изменения
    const changes = [];
    if (title !== undefined && title !== existingTask.title) {
      changes.push({ field: 'title', old_value: existingTask.title, new_value: title });
    }
    if (description !== undefined && description !== existingTask.description) {
      changes.push({ field: 'description', old_value: existingTask.description, new_value: description });
    }
    if (assigned_to !== undefined && assigned_to != existingTask.assigned_to) {
      changes.push({ field: 'assigned_to', old_value: existingTask.assigned_to, new_value: assigned_to });
    }
    if (priority !== undefined && priority !== existingTask.priority) {
      changes.push({ field: 'priority', old_value: existingTask.priority, new_value: priority });
    }
    if (due_date !== undefined && String(due_date) !== String(existingTask.due_date)) {
      changes.push({ field: 'due_date', old_value: existingTask.due_date, new_value: due_date });
    }
    if (status !== undefined && status !== existingTask.status) {
      changes.push({ field: 'status', old_value: existingTask.status, new_value: status });
    }

    // Обновляем задачу
    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, assigned_to = ?, priority = ?, due_date = ?, status = ? WHERE id = ?',
      [title, description, assigned_to, priority, due_date, status, id]
    );

    // Логируем изменения в task_history
    for (const change of changes) {
      await pool.query(
        'INSERT INTO task_history (task_id, user_id, field, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
        [id, req.userId, change.field, String(change.old_value), String(change.new_value)]
      );
    }

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

const getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const [history] = await pool.query(
      `SELECT h.id, h.field, h.old_value, h.new_value, h.changed_at, u.username as changed_by
       FROM task_history h
       LEFT JOIN users u ON h.user_id = u.id
       WHERE h.task_id = ?
       ORDER BY h.changed_at DESC`,
      [id]
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task history', error: error.message });
  }
};

// Получить все файлы задачи
const getTaskFiles = async (req, res) => {
  try {
    const { taskId } = req.params;
    const [files] = await pool.query(
      'SELECT id, filename, originalname, uploaded_at, user_id FROM task_files WHERE task_id = ?',
      [taskId]
    );
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching files', error: error.message });
  }
};

// Загрузить файл для задачи
const uploadTaskFile = async (req, res) => {
  try {
    const { taskId } = req.params;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    await pool.query(
      'INSERT INTO task_files (task_id, user_id, filename, originalname) VALUES (?, ?, ?, ?)',
      [taskId, req.userId, req.file.filename, req.file.originalname]
    );
    res.status(201).json({ message: 'File uploaded', filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
};

const searchTasks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Необходимо указать поисковый запрос (q)' });
    }
    // Поиск только среди задач, к которым пользователь имеет доступ
    const query = `SELECT * FROM tasks WHERE (created_by = ? OR assigned_to = ?) AND (title LIKE ? OR description LIKE ?)`;
    const likeQ = `%${q}%`;
    const params = [req.userId, req.userId, likeQ, likeQ];
    const [tasks] = await pool.query(query, params);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка поиска задач', error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const [tasks] = await pool.query(
      `SELECT t.*, u.username as assigned_to_username
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.id = ? AND (t.created_by = ? OR t.assigned_to = ?)`,
      [id, req.userId, req.userId]
    );
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    res.json(tasks[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching task', error: error.message });
  }
};

module.exports = {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  getTaskFiles,
  uploadTaskFile,
  searchTasks, // добавляем экспорт
  getTaskById // добавляем экспорт
};
