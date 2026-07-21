'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, models } = require('../../libs/sequelize');
const { ConflictError } = require('../../utils/errors');
const categoryService = require('../category_service');
const { generateToken } = require('./shared');

async function buildUniqueUsername(base) {
  const normalized = (base || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 100) || 'user';
  let candidate = normalized;
  let suffix = 0;
  while (await models.User.findOne({ where: { username: candidate }, attributes: ['id'] })) {
    suffix += 1;
    candidate = `${normalized}${suffix}`.slice(0, 120);
  }
  return candidate;
}

async function login(username, password) {
  const user = await models.User.findOne({
    where: {
      [Op.or]: [
        { username },
        { email: username },
      ],
    },
    attributes: ['id', 'username', 'email', 'name', 'passwordHash'],
  });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;

  return {
    token: generateToken(user.id),
    user: { id: user.id, username: user.username, email: user.email, name: user.name },
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

    await models.Account.create({
      name: 'Efectivo',
      type: 'efectivo',
      currency: 'USD',
      balance: 0,
      userId: created.id,
    }, { transaction: t });

    await categoryService.createDefaultCategories(created.id, t);

    return {
      token: generateToken(created.id),
      user: { id: created.id, username: created.username, email: created.email, name: created.name },
    };
  });
}

module.exports = { buildUniqueUsername, login, register };
