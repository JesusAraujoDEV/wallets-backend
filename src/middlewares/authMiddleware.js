const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            const { rows } = await db.query('SELECT id, username FROM users WHERE id = $1', [decoded.id]);
            
            if (rows.length === 0) {
                return res.status(401).json({ ok: false, message: 'No autorizado, usuario no encontrado.' });
            }
            
            req.user = rows[0];
            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ ok: false, message: 'No autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ ok: false, message: 'No autorizado, no se proporcionó token.' });
    }
};

module.exports = { protect };
