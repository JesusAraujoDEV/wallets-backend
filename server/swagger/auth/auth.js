/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *           example: false
 *         statusCode:
 *           type: integer
 *           example: 400
 *         error:
 *           type: string
 *           example: BAD_REQUEST
 *         message:
 *           type: string
 *           example: El campo "email" es requerido.
 *     LoginRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         password:
 *           type: string
 *       required: [username, password]
 *     RegisterRequest:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *         name:
 *           type: string
 *           minLength: 3
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 6
 *       required: [username, email, password]
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *     LoginResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 *     RegisterResponse:
 *       type: object
 *       properties:
 *         ok:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/register:
 *   post:
 *     summary: Registro de usuario y login automático
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registro exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       409:
 *         description: Usuario o email ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/me:
 *   get:
 *     summary: Información del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *
 * /auth/logout:
 *   post:
 *     summary: Logout simbólico
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 */

module.exports = {};
