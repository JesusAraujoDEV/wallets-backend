const jwt = require('jsonwebtoken');
const { models } = require('../libs/sequelize');

async function protect(req, res, next) {
  let token;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) token = header.split(' ')[1];

  if (!token) {
    return res.status(401).json({ ok: false, message: 'No autorizado, token requerido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findByPk(decoded.id, { attributes: ['id', 'username'] });
    if (!user) return res.status(401).json({ ok: false, message: 'No autorizado, usuario no encontrado.' });
    req.user = user.toJSON();
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, message: 'No autorizado, token inválido.' });
  }
}

module.exports = { protect };
