const jwt = require('jsonwebtoken');
const { sequelize, models } = require('../libs/sequelize');

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

async function login(username, password) {
  // Use PostgreSQL crypt via sequelize.query for compatibility with existing hashes
  const [rows] = await sequelize.query(
    `SELECT id, username, password_hash FROM users WHERE username = :username AND password_hash = crypt(:password, password_hash)`,
    { replacements: { username, password } }
  );
  if (rows.length === 0) return null;
  const user = rows[0];
  return {
    token: generateToken(user.id),
    user: { id: user.id, username: user.username },
  };
}

module.exports = { login };
