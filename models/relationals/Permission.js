const { DataTypes } = require('sequelize');
const sequelize = require('../../config/sequelize');

const Permission = sequelize.define('Permission', {
  key: {
    type: DataTypes.STRING(100),
    unique: true
  },
  description: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'permissions',
  timestamps: false
});

module.exports = Permission;