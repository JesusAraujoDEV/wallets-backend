const express = require('express');
const router = express.Router();
const { getCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestión de categorías
 */

router.use(protect);

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Obtiene todas las categorías del usuario
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de categorías.
 *   post:
 *     summary: Crea una nueva categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ingreso, gasto]
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               colorName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Categoría creada.
 *       409:
 *         description: La categoría ya existe.
 *   patch:
 *     summary: Actualiza una categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ingreso, gasto]
 *               icon:
 *                 type: string
 *               color:
 *                 type: string
 *               colorName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada.
 *   delete:
 *     summary: Elimina una categoría
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Categoría eliminada.
 */
router.route('/')
    .get(getCategories)
    .post(createCategory)
    .patch(updateCategory)
    .put(updateCategory)
    .delete(deleteCategory);

module.exports = router;
