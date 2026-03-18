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
 *     ForgotPasswordRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *       required: [email]
 *     ResetPasswordRequest:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *         newPassword:
 *           type: string
 *           minLength: 6
 *       required: [token, newPassword]
 *     UpdateProfileRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           maxLength: 120
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 25
 *         email:
 *           type: string
 *           format: email
 *       description: Debe incluir al menos uno de los campos name, username o email.
 *     GenericSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Operación completada correctamente.
 *         data:
 *           type: object
 *           example: {}
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
 *   patch:
 *     summary: Actualizar perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Perfil actualizado correctamente.
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Datos inválidos o email/username ya en uso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autenticado o token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/logout:
 *   post:
 *     summary: Logout simbólico
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout exitoso
 *
 * /auth/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: header
 *         name: Origin
 *         required: false
 *         schema:
 *           type: string
 *         description: Origen del frontend solicitante. Si no coincide con FRONTEND_URLS se usa fallback seguro.
 *       - in: header
 *         name: Referer
 *         required: false
 *         schema:
 *           type: string
 *         description: Referer alternativo cuando Origin no está disponible.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Solicitud procesada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericSuccessResponse'
 *       400:
 *         description: Solicitud inválida o no procesable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 * /auth/reset-password:
 *   post:
 *     summary: Restablecer contraseña con token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Contraseña restablecida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GenericSuccessResponse'
 *       400:
 *         description: Token inválido, expirado o request inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

module.exports = {};
