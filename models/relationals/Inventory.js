const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  reserved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
}, {
  tableName: 'inventory',
  timestamps: true,
  validate: {
    reservedCannotExceedStock() {
      if (this.reserved > this.stock) {
        throw new Error('reserved no puede ser mayor que stock');
      }
    },
  },
});

module.exports = Inventory;
