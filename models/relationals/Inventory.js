const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Inventory = sequelize.define('Inventory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  variant_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0, max: 2_147_483_647 } },
  reserved: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { isInt: true, min: 0, max: 2_147_483_647 } },
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
