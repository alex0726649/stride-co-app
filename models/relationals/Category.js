const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
}, {
  tableName: 'categories',
  timestamps: true,
});

module.exports = Category;
