const { Sequelize } = require('sequelize');
const config = require('config');

const postgresConfig = config.get('db.postgres');

const sslEnabled = String(postgresConfig.ssl.enabled).toLowerCase() === 'true';
const rejectUnauthorized = String(postgresConfig.ssl.rejectUnauthorized).toLowerCase() === 'true';

const sequelize = new Sequelize(
    postgresConfig.database,
    postgresConfig.user,
    postgresConfig.password,
    {
        host: postgresConfig.host,
        port: Number(postgresConfig.port),
        dialect: 'postgres',
        ...(sslEnabled && {
            dialectOptions: {
                ssl: {
                    require: true,
                    rejectUnauthorized,
                },
            },
        }),
        logging: false,
        define: {
            underscored: true
        }
    }
);
    
    
module.exports = sequelize;
