const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Role = sequelize.define('Role', {
  name: {
    type: DataTypes.STRING(50)
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'roles',
  timestamps: false
});

module.exports = Role;