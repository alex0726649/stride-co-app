const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // El nombre identifica al rol en el RBAC: no puede repetirse.
    unique: true,
    validate: { notEmpty: true }
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'roles',
  timestamps: false
});

module.exports = Role;
