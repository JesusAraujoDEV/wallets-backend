const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ ok: false, message: 'Por favor, proporcione usuario y contraseña.' });
    }

    // Usamos pgcrypto en la DB, por lo que la comparación se hace en la query
    const query = `
        SELECT id, username, password_hash 
        FROM public.users 
        WHERE username = $1 AND password_hash = crypt($2, password_hash);
    `;

    try {
        const { rows } = await db.query(query, [username, password]);

        if (rows.length > 0) {
            const user = rows[0];
            res.json({
                ok: true,
                token: generateToken(user.id),
                user: {
                    id: user.id,
                    username: user.username,
                },
            });
        } else {
            res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
        }
    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ ok: false, message: 'Error del servidor durante el login.' });
    }
};

const getMe = async (req, res) => {
    // El usuario ya está en req.user gracias al middleware 'protect'
    res.status(200).json({
        ok: true,
        user: req.user,
    });
};

// No hay un "logout" real en el backend con JWT. El cliente simplemente borra el token.
// Se puede crear un endpoint para invalidar tokens si se usa una blacklist, pero para este caso es suficiente.
const logout = (req, res) => {
    res.status(200).json({ ok: true, message: 'Logout exitoso. Por favor, elimine el token en el cliente.' });
};


module.exports = {
    login,
    getMe,
    logout,
};
