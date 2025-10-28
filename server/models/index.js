const { defineUserModel } = require('./user_model');
const { defineAccountModel } = require('./account_model');
const { defineCategoryModel } = require('./category_model');
const { defineTransactionModel } = require('./transaction_model');

function setupModels(sequelize) {
  const User = defineUserModel(sequelize);
  const Account = defineAccountModel(sequelize);
  const Category = defineCategoryModel(sequelize);
  const Transaction = defineTransactionModel(sequelize);

  // Associations
  User.hasMany(Account, { foreignKey: 'user_id' });
  Account.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Category, { foreignKey: 'user_id' });
  Category.belongsTo(User, { foreignKey: 'user_id' });

  User.hasMany(Transaction, { foreignKey: 'user_id' });
  Transaction.belongsTo(User, { foreignKey: 'user_id' });

  Account.hasMany(Transaction, { foreignKey: 'account_id' });
  Transaction.belongsTo(Account, { foreignKey: 'account_id' });

  Category.hasMany(Transaction, { foreignKey: 'category_id' });
  Transaction.belongsTo(Category, { foreignKey: 'category_id' });

  return { User, Account, Category, Transaction };
}

module.exports = { setupModels };