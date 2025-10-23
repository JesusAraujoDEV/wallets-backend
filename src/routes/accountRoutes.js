const express = require('express');
const router = express.Router();
const { getAccounts, createAccount, updateAccount, deleteAccount } = require('../controllers/accountController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Accounts
 *   description: Gestión de cuentas
 */

router.use(protect);

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Obtiene todas las cuentas del usuario
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de cuentas.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   currency:
 *                     type: string
 *                   balance:
 *                     type: number
 *                   userId:
 *                     type: integer
 *   post:
 *     summary: Crea una nueva cuenta
 *     tags: [Accounts]
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
 *               - currency
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Cuenta de Ahorros"
 *               type:
 *                 type: string
 *                 example: "ahorros"
 *               currency:
 *                 type: string
 *                 example: "USD"
 *               balance:
 *                 type: number
 *                 example: 1000.50
 *     responses:
 *       201:
 *         description: Cuenta creada exitosamente.
 *   patch:
 *     summary: Actualiza una cuenta existente
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la cuenta a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               currency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cuenta actualizada.
 *       404:
 *         description: Cuenta no encontrada.
 *   delete:
 *     summary: Elimina una cuenta
 *     tags: [Accounts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la cuenta a eliminar
 *     responses:
 *       200:
 *         description: Cuenta eliminada.
 *       400:
 *         description: La cuenta tiene transacciones asociadas.
 *       404:
 *         description: Cuenta no encontrada.
 */
router.route('/')
    .get(getAccounts)
    .post(createAccount)
    .patch(updateAccount)
    .put(updateAccount)
    .delete(deleteAccount);

module.exports = router;
