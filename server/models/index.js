const { User, UserSchema } = require('./user.model');
const { Account, AccountSchema } = require('./account.model');
const { Category, CategorySchema } = require('./category.model');
const { CategoryGroup, CategoryGroupSchema } = require('./category_group.model');
const { Transaction, TransactionSchema } = require('./transaction.model');
const { RecurringTransaction, RecurringTransactionSchema } = require('./recurring_transaction.model');
const { Budget, BudgetSchema } = require('./budget.model');
const { TelegramSession, TelegramSessionSchema } = require('./telegram_session.model');
const { OtpCode, OtpCodeSchema } = require('./otp_code.model');

function setupModels(sequelize) {
  // 1. Inicializar
  User.init(UserSchema, User.config(sequelize));
  Account.init(AccountSchema, Account.config(sequelize));
  CategoryGroup.init(CategoryGroupSchema, CategoryGroup.config(sequelize));
  Category.init(CategorySchema, Category.config(sequelize));
  Transaction.init(TransactionSchema, Transaction.config(sequelize));
  RecurringTransaction.init(RecurringTransactionSchema, RecurringTransaction.config(sequelize));
  Budget.init(BudgetSchema, Budget.config(sequelize));
  TelegramSession.init(TelegramSessionSchema, TelegramSession.config(sequelize));
  OtpCode.init(OtpCodeSchema, OtpCode.config(sequelize));

  // 2. Asociar
  User.associate(sequelize.models);
  Account.associate(sequelize.models);
  CategoryGroup.associate(sequelize.models);
  Category.associate(sequelize.models);
  Transaction.associate(sequelize.models);
  RecurringTransaction.associate(sequelize.models);
  Budget.associate(sequelize.models);
  TelegramSession.associate(sequelize.models);
  OtpCode.associate(sequelize.models);

  return sequelize.models;
}

module.exports = { setupModels };