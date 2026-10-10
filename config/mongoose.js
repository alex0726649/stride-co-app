const mongoose = require('mongoose');

//Conexion mongodb

function connectMongo( {
    const uri = "mongodb://localhost:27017//stride_co"
    return mongoose.connext(uri);

    module.exports = connectMongo;
})