const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  size: { type: DataTypes.STRING(30), allowNull: false },
  color: { type: DataTypes.STRING(50), allowNull: false },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'product_variants',
  timestamps: true,
});

module.exports = ProductVariant;
