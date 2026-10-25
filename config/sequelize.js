const {Sequelize}= require('sequelize');
const config = require('config');

const mysqlConfig = config.get("mysql");

console.log('Entorno:', config.util.getEnv('NODE_ENV'));
console.log('Base MySQL seleccionada:', mysqlConfig.database);
//falta cambiar para que use mysqlconfig

const sequelize = new Sequelize(
    mysqlConfig.database,
    mysqlConfig.user,
    mysqlConfig.password,
    {
        host: mysqlConfig.host,
        port: mysqlConfig.port,
        dialect: 'mysql',
        logging: false,
        define: {
            underscored: true
        }
    }
);
    
    
    module.exports =sequelize; 
