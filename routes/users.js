const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middlewares/auth');
const pool = require('../config/db');

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Управление пользователями
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Получить профиль текущего пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль пользователя
 */
router.get('/profile', auth, (req, res) => {
  res.json({ message: 'User profile endpoint' });
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 */
router.get('/', auth, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Сменить роль пользователя (только admin)
router.patch('/:id/role', auth, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'user', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating role', error: error.message });
  }
});

module.exports = router;
