const mongoose = require('mongoose');
const connectMongo = require('../config/mongoose');
const { sequelize } = require('../models/relationals');
const seedPostgres = require('./seed-postgres');
const seedMongo = require('./seed-mongo');

async function seed() {
  try {
    await connectMongo();
    const { users, demoProductId } = await seedPostgres();
    await seedMongo(users, demoProductId);
  } finally {
    await Promise.all([mongoose.disconnect(), sequelize.close()]);
  }
}

seed()
  .then(() => console.log('Datos iniciales cargados en PostgreSQL y MongoDB.'))
  .catch((error) => {
    console.error('No se pudo completar la carga inicial:', error.message);
    process.exitCode = 1;
  });
