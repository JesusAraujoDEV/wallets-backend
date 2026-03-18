const { Model, DataTypes, Sequelize } = require('sequelize');
const { USER_TABLE } = require('./user.model');

const OTP_CODE_TABLE = 'otp_codes';

const OtpCodeSchema = {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.INTEGER,
  },
  userId: {
    allowNull: false,
    type: DataTypes.INTEGER,
    field: 'user_id',
    references: {
      model: USER_TABLE,
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  code: {
    allowNull: false,
    type: DataTypes.STRING(6),
  },
  type: {
    allowNull: false,
    type: DataTypes.STRING(50),
  },
  expiresAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'expires_at',
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: Sequelize.NOW,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
    field: 'updated_at',
    defaultValue: Sequelize.NOW,
  },
};

class OtpCode extends Model {
  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id' });
  }

  static config(sequelize) {
    return {
      sequelize,
      tableName: OTP_CODE_TABLE,
      modelName: 'OtpCode',
      timestamps: true,
    };
  }
}

module.exports = { OTP_CODE_TABLE, OtpCodeSchema, OtpCode };
