const {DataTypes}=require('sequelize');
const sequelize = require('../../config/sequelize');

const User=sequelize.define('User',{  //es un objeta para la base de datos
    first_name:{type:DataTypes.STRING(100),allowNull:false},
    last_name:{type:DataTypes.STRING(100),allowNull:false},
    email:{type:DataTypes.STRING(150),allowNull:false,unique:true},
    active:{type:DataTypes.BOOLEAN,defaultValue:true}

},{
    tableName:'users',
    timestamps:true// -> created_at, updated_at


});

module.exports = User;