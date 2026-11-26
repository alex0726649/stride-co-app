const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Permission = sequelize.define('Permission', {
  key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    // Mismo formato que interpreta utils/rbac.js: recurso:acción:alcance.
    validate: { is: /^[a-z]+:(create|read|update|delete):(own|any)$/ }
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'permissions',
  timestamps: false
});

module.exports = Permission;
