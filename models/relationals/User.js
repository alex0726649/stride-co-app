const {DataTypes}=require('sequelize');
const sequelize = require('../../config/sequelize');

const User=sequelize.define('User',{  //es un objeta para la base de datos
    first_name:{type:DataTypes.STRING(100),allowNull:false},
    last_name:{type:DataTypes.STRING(100),allowNull:false},
    email:{type:DataTypes.STRING(150),allowNull:false},
    active:{type:DataTypes.BOOLEAN,defaultValue:true},
    password: {type:DataTypes.STRING(100), allowNull:false},
    salt_key: {type: DataTypes.STRING(100), allowNull: false}

},{
    tableName:'users',
    timestamps:true// -> created_at, updated_at


});
User.prototype.toJSON = function(){
    const values = {...this.get()};
    delete values.password_hash;
    delete values.salt_key;
    return values;
};
module.exports = User;