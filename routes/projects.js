const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/auth');
const {
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectTasks
} = require('../controllers/projects');

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Управление проектами
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Получить все проекты пользователя
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список проектов
 */
router.get('/', auth, getAllProjects);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Создать новый проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Проект создан
 */
router.post('/', auth, createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Обновить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID проекта
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Проект обновлен
 *       404:
 *         description: Проект не найден или нет доступа
 */
router.put('/:id', auth, updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Удалить проект
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Проект удален
 *       404:
 *         description: Проект не найден или нет доступа
 */
router.delete('/:id', auth, deleteProject);

/**
 * @swagger
 * /api/projects/{id}/tasks:
 *   get:
 *     summary: Получить задачи проекта
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID проекта
 *     responses:
 *       200:
 *         description: Список задач проекта
 *       404:
 *         description: Проект не найден или нет доступа
 */
router.get('/:id/tasks', auth, getProjectTasks);

module.exports = router;