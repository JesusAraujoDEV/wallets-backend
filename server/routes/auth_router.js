const express = require('express');
const router = express.Router();
const authService = require('../services/auth_service');
const { protect } = require('../middlewares/auth_handler');

// Login
router.post('/login', async (req, res) => {
	const { username, password } = req.body || {};
	if (!username || !password) return res.status(400).json({ ok: false, message: 'Usuario y contraseña requeridos.' });
	try {
		const result = await authService.login(username, password);
		if (!result) return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
		res.json({ ok: true, token: result.token, user: result.user });
	} catch (e) {
		res.status(500).json({ ok: false, message: 'Error del servidor durante el login.' });
	}
});

// Me
router.get('/me', protect, (req, res) => {
	res.json({ ok: true, user: req.user });
});

// Logout (simbólico)
router.post('/logout', (_req, res) => {
	res.json({ ok: true, message: 'Logout exitoso. Elimine el token en el cliente.' });
});

module.exports = router;
