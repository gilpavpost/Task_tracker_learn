const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  getAllTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskHistory,
  getTaskFiles,
  uploadTaskFile,
  searchTasks,
  getTaskById
} = require('../controllers/tasks');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Управление задачами
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Получить все задачи пользователя
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Фильтр по статусу задачи
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: integer
 *         description: Фильтр по исполнителю
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Фильтр по проекту
 *       - in: query
 *         name: due_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата дедлайна от (включительно)
 *       - in: query
 *         name: due_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Дата дедлайна до (включительно)
 *     responses:
 *       200:
 *         description: Список задач
 */
router.get('/', auth, getAllTasks);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Создать новую задачу
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - project_id
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               project_id:
 *                 type: integer
 *               assigned_to:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Задача создана
 */
router.post('/', auth, createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Обновить задачу
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assigned_to:
 *                 type: integer
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *               due_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, done]
 *     responses:
 *       200:
 *         description: Задача обновлена
 *       404:
 *         description: Задача не найдена или нет доступа
 */
router.put('/:id', auth, updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Удалить задачу
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Задача удалена
 *       404:
 *         description: Задача не найдена или нет доступа
 */
router.delete('/:id', auth, deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/history:
 *   get:
 *     summary: Получить историю изменений задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: История изменений задачи
 */
router.get('/:id/history', auth, getTaskHistory);

/**
 * @swagger
 * /api/tasks/{taskId}/files:
 *   get:
 *     summary: Получить все файлы задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Список файлов задачи
 */
router.get('/:taskId/files', auth, getTaskFiles);

/**
 * @swagger
 * /api/tasks/{taskId}/files:
 *   post:
 *     summary: Загрузить файл для задачи
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: path
 *         name: taskId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *       - in: formData
 *         name: file
 *         type: file
 *         required: true
 *         description: Файл для загрузки
 *     responses:
 *       201:
 *         description: Файл загружен
 */
router.post('/:taskId/files', auth, upload.single('file'), uploadTaskFile);

/**
 * @swagger
 * /api/tasks/search:
 *   get:
 *     summary: Поиск задач по тексту (title, description)
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Поисковый запрос
 *     responses:
 *       200:
 *         description: Список найденных задач
 */
router.get('/search', auth, searchTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Получить задачу по ID
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID задачи
 *     responses:
 *       200:
 *         description: Данные задачи
 *       404:
 *         description: Задача не найдена или нет доступа
 */
router.get('/:id', auth, getTaskById);

module.exports = router;