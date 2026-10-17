const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, unique: true },
  stock: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  reserved: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'inventory',
  timestamps: true,
});

module.exports = Inventory;
