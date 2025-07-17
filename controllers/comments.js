const pool = require('../config/db');

// Получить все комментарии к задаче
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const [comments] = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.updated_at, u.username as author
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching comments', error: error.message });
  }
};

// Добавить комментарий к задаче
const addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    await pool.query(
      'INSERT INTO comments (task_id, user_id, content) VALUES (?, ?, ?)',
      [taskId, req.userId, content]
    );
    res.status(201).json({ message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Обновить комментарий
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    // Проверка, что комментарий принадлежит пользователю
    const [comments] = await pool.query('SELECT * FROM comments WHERE id = ? AND user_id = ?', [id, req.userId]);
    if (comments.length === 0) return res.status(403).json({ message: 'Forbidden' });
    await pool.query('UPDATE comments SET content = ?, updated_at = NOW() WHERE id = ?', [content, id]);
    res.json({ message: 'Comment updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment', error: error.message });
  }
};

// Удалить комментарий
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    // Проверка, что комментарий принадлежит пользователю или пользователь admin
    const [comments] = await pool.query('SELECT * FROM comments WHERE id = ?', [id]);
    if (comments.length === 0) return res.status(404).json({ message: 'Comment not found' });
    if (comments[0].user_id !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await pool.query('DELETE FROM comments WHERE id = ?', [id]);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment', error: error.message });
  }
};

module.exports = {
  getComments,
  addComment,
  updateComment,
  deleteComment
}; 