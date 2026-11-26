const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');
const Inventory = require('./Inventory');

const ProductVariant = sequelize.define('ProductVariant', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  sku: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true } },
  size: { type: DataTypes.STRING(30), allowNull: false, validate: { notEmpty: true } },
  color: { type: DataTypes.STRING(50), allowNull: false, validate: { notEmpty: true } },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'product_variants',
  timestamps: true,
  hooks: {
    afterCreate: async (variant, options) => {
      await Inventory.findOrCreate({
        where: { variant_id: variant.id },
        defaults: { stock: 0, reserved: 0 },
        transaction: options.transaction,
      });
    },
  },
});

ProductVariant.createWithInventory = async (values, options = {}) => sequelize.transaction(async (transaction) => {
  const variant = await ProductVariant.create(values, { ...options, transaction });
  const inventory = await Inventory.findOne({ where: { variant_id: variant.id }, transaction });
  return { variant, inventory };
});

module.exports = ProductVariant;
