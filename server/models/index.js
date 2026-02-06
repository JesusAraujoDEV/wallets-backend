const { User, UserSchema } = require('./user.model');
const { Account, AccountSchema } = require('./account.model');
const { Category, CategorySchema } = require('./category.model');
const { Transaction, TransactionSchema } = require('./transaction.model');
const { TelegramSession, TelegramSessionSchema } = require('./telegram_session.model');

function setupModels(sequelize) {
  // 1. Inicializar
  User.init(UserSchema, User.config(sequelize));
  Account.init(AccountSchema, Account.config(sequelize));
  Category.init(CategorySchema, Category.config(sequelize));
  Transaction.init(TransactionSchema, Transaction.config(sequelize));
  TelegramSession.init(TelegramSessionSchema, TelegramSession.config(sequelize));

  // 2. Asociar
  User.associate(sequelize.models);
  Account.associate(sequelize.models);
  Category.associate(sequelize.models);
  Transaction.associate(sequelize.models);
  TelegramSession.associate(sequelize.models);

  return sequelize.models;
}

module.exports = { setupModels };