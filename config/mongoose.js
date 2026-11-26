const mongoose = require('mongoose');
const config = require('config');

function connectMongo() {
    return mongoose.connect(config.get('db.mongo.uri'));
}

module.exports = connectMongo;
