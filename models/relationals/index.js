const sequelize = require('../../config/sequelize');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');
const Product = require('./Product');
const ProductVariant = require('./ProductVariant');
const Inventory = require('./Inventory');
const Category = require('./Category');


Role.hasMany(User, {
    foreignKey: 'role_id',
    as: 'users'
  });
  
  User.belongsTo(Role, {
    foreignKey: 'role_id',
    as: 'role'
  });

Role.belongsToMany(Permission, {
  through: 'role_permission',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
  timestamps: false
});

Permission.belongsToMany(Role, {
  through: 'role_permission',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
  timestamps: false
});

Product.hasMany(ProductVariant, { foreignKey: 'product_id', as: 'variants' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

ProductVariant.hasOne(Inventory, { foreignKey: 'variant_id', as: 'inventory' });
Inventory.belongsTo(ProductVariant, { foreignKey: 'variant_id', as: 'variant' });

module.exports = { sequelize, User, Role, Permission, Category, Product, ProductVariant, Inventory };
