const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  getComments,
  addComment,
  updateComment,
  deleteComment
} = require('../controllers/comments');

// Получить все комментарии к задаче
router.get('/task/:taskId', auth, getComments);
// Добавить комментарий к задаче
router.post('/task/:taskId', auth, addComment);
// Обновить комментарий
router.put('/:id', auth, updateComment);
// Удалить комментарий
router.delete('/:id', auth, deleteComment);

module.exports = router; 