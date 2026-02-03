const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, models } = require('../libs/sequelize');
const { ConflictError } = require('../utils/errors');

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

async function register({ username, email, password, name }) {
  const existing = await models.User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email },
      ],
    },
  });
  if (existing) throw new ConflictError('El usuario o email ya existe.');

  const passwordHash = await bcrypt.hash(password, 10);

  return await sequelize.transaction(async (t) => {
    const created = await models.User.create({
      username,
      email,
      name: name || null,
      passwordHash,
    }, { transaction: t });

    // Onboarding: create default cash wallet
    await models.Account.create({
      name: 'Efectivo',
      type: 'efectivo',
      currency: 'USD',
      balance: 0,
      userId: created.id,
    }, { transaction: t });

    return {
      token: generateToken(created.id),
      user: { id: created.id, username: created.username, email: created.email, name: created.name },
    };
  });
}

module.exports = { login, register };
