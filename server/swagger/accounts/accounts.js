/**
 * @swagger
 * components:
 *   schemas:
 *     Account:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         balance:
 *           type: string
 *           description: Balance como string decimal
 *         currency:
 *           type: string
 *         userId:
 *           type: integer
 *       required: [id, name, balance, currency]
 *     AccountCreate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         balance:
 *           type: string
 *         currency:
 *           type: string
 *       required: [name, balance, currency]
 *     AccountUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         balance:
 *           type: string
 *         currency:
 *           type: string
 */

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Listar cuentas del usuario autenticado
 *     tags: [Accounts]
 *     responses:
 *       200:
 *         description: Lista de cuentas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Account'
 *   post:
 *     summary: Crear una nueva cuenta
 *     tags: [Accounts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AccountCreate'
 *     responses:
 *       201:
 *         description: Cuenta creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *   patch:
 *     summary: Actualizar una cuenta (parcial)
 *     tags: [Accounts]
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
 *             $ref: '#/components/schemas/AccountUpdate'
 *     responses:
 *       200:
 *         description: Cuenta actualizada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Account'
 *   delete:
 *     summary: Eliminar una cuenta
 *     tags: [Accounts]
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Eliminación exitosa
 */

module.exports = {};
