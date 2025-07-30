const pool = require('../config/db');
const path = require('path');

// Новый импорт для работы с массивами
const uniq = arr => [...new Set(arr)];

const getAllTasks = async (req, res) => {
  try {
    const { status, assigned_to, project_id, due_from, due_to } = req.query;
    let query = `SELECT t.*, GROUP_CONCAT(ta.user_id) as assignees
                 FROM tasks t
                 LEFT JOIN task_assignees ta ON t.id = ta.task_id
                 WHERE (t.created_by = ? OR ta.user_id = ?)`;
    const params = [req.userId, req.userId];
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    if (assigned_to) {
      query += ' AND ta.user_id = ?';
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
    query += ' GROUP BY t.id';
    const [tasks] = await pool.query(query, params);
    // assignees как массив чисел
    tasks.forEach(t => t.assignees = t.assignees ? t.assignees.split(',').map(Number) : []);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, project_id, assignees, priority, due_date, status, estimated_hours } = req.body;
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, project_id, created_by, priority, due_date, status, estimated_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description, project_id, req.userId, priority, due_date, status || 'todo', estimated_hours]
    );
    const taskId = result.insertId;
    // Добавляем исполнителей
    if (Array.isArray(assignees) && assignees.length > 0) {
      const values = uniq(assignees).map(uid => [taskId, uid]);
      await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ?', [values]);
    }
    const [task] = await pool.query('SELECT * FROM tasks WHERE id = ?', [taskId]);
    const [assigned] = await pool.query('SELECT user_id FROM task_assignees WHERE task_id = ?', [taskId]);
    task[0].assignees = assigned.map(a => a.user_id);
    res.status(201).json(task[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignees, priority, due_date, status, estimated_hours } = req.body;
    // Проверка доступа
    const [existingTaskArr] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?', [id]
    );
    if (existingTaskArr.length === 0) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }
    // Обновляем задачу
    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, priority = ?, due_date = ?, status = ?, estimated_hours = ? WHERE id = ?',
      [title, description, priority, due_date, status, estimated_hours, id]
    );
    // Обновляем исполнителей
    if (Array.isArray(assignees)) {
      await pool.query('DELETE FROM task_assignees WHERE task_id = ?', [id]);
      if (assignees.length > 0) {
        const values = uniq(assignees).map(uid => [id, uid]);
        await pool.query('INSERT INTO task_assignees (task_id, user_id) VALUES ?', [values]);
      }
    }
    const [updatedTask] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    const [assigned] = await pool.query('SELECT user_id FROM task_assignees WHERE task_id = ?', [id]);
    updatedTask[0].assignees = assigned.map(a => a.user_id);
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

// Новый эндпоинт: логирование времени по задаче
const logTaskTime = async (req, res) => {
  try {
    const { task_id, log_date, hours, comment } = req.body;
    // Проверка: пользователь должен быть исполнителем задачи
    const [assignee] = await pool.query('SELECT * FROM task_assignees WHERE task_id = ? AND user_id = ?', [task_id, req.userId]);
    if (assignee.length === 0) {
      return res.status(403).json({ message: 'You are not assigned to this task' });
    }
    await pool.query(
      'INSERT INTO task_time_logs (task_id, user_id, log_date, hours, comment) VALUES (?, ?, ?, ?, ?)',
      [task_id, req.userId, log_date, hours, comment]
    );
    res.status(201).json({ message: 'Time logged' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging time', error: error.message });
  }
};

// Новый эндпоинт: сводка по пользователю за месяц
const getUserTimeSummary = async (req, res) => {
  try {
    const { user_id, year, month } = req.query;
    const uid = user_id || req.userId;
    const [rows] = await pool.query(
      `SELECT t.id as task_id, t.title, l.log_date, l.hours, l.comment
       FROM task_time_logs l
       JOIN tasks t ON l.task_id = t.id
       WHERE l.user_id = ? AND YEAR(l.log_date) = ? AND MONTH(l.log_date) = ?
       ORDER BY l.log_date ASC, t.title ASC`,
      [uid, year, month]
    );
    // Группируем по дате
    const summary = {};
    for (const row of rows) {
      if (!summary[row.log_date]) summary[row.log_date] = [];
      summary[row.log_date].push({
        task_id: row.task_id,
        title: row.title,
        hours: row.hours,
        comment: row.comment
      });
    }
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error: error.message });
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
  searchTasks,
  getTaskById,
  logTaskTime,
  getUserTimeSummary
};
