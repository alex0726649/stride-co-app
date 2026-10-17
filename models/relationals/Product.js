const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  brand: { type: DataTypes.STRING(100), allowNull: false },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: { min: 0 },
  },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
