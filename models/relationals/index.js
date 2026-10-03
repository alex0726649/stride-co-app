const sequelize = require('../../config/sequelize');
const User = require('./User');
const Role = require('./Role');
const Permission = require('./Permission');


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

module.exports={sequelize,User,Role,Permission};