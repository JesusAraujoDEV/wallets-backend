const express = require('express');
const router = express.Router();
const { getTransactions, createTransaction, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Gestión de transacciones
 */

router.use(protect);

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Obtiene transacciones con filtros y paginación
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: grouped
 *         schema:
 *           type: string
 *           enum: ['1']
 *         description: Activa la paginación agrupada por días.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: cursorDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Búsqueda por texto en descripción o categoría.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Lista de transacciones.
 *   post:
 *     summary: Crea una nueva transacción
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       - Si `currency` = `VES`, el backend calculará automáticamente `amount_usd` y `exchange_rate_used` usando la tasa del día indicada en `date` desde api.dolarvzla.com.
 *       - Si `currency` = `USD`, `amount_usd` será igual a `amount` y no se consultará la API.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [USD, VES]
 *               date:
 *                 type: string
 *                 format: date
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Transacción creada.
 *   patch:
 *     summary: Actualiza una transacción
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       - Si `currency` = `VES`, se recalcularán `amount_usd` y `exchange_rate_used` en base a la `date` enviada.
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
 *               description:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 enum: [USD, VES]
 *               date:
 *                 type: string
 *                 format: date
 *               categoryId:
 *                 type: integer
 *               accountId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transacción actualizada.
 *   delete:
 *     summary: Elimina una transacción
 *     tags: [Transactions]
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
 *         description: Transacción eliminada.
 */
router.route('/')
    .get(getTransactions)
    .post(createTransaction)
    .patch(updateTransaction)
    .put(updateTransaction)
    .delete(deleteTransaction);

module.exports = router;
