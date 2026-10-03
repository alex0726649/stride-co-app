const {Sequelize}= require('sequelize');

//conexion  a MYSQL
const sequelize = new Sequelize(
    //nombre de la base de datos
    'stride_co',
    // nombre del ususario de la base de datos
    'root',
    //pasword de la base de datos
    'abcd1234',
    {//host define la direccion del servidor de la base de datos
        host: 'localhost',
        //puerto en el que atiende nuestro servidor de Base de datos
        port:3306,
        //dialect : es la propiedad donde definimos la base de datos que vamos a usar
        dialect:'mysql',
        logging:false,
        define:{
            //nos permite definir si queremos agregar automaticamente a nuestros modelos las propiedades, createdAt->created_at, rol_id
            underscored: true
        }
    
    
    }
    
    );
    
    module.exports =sequelize; 
