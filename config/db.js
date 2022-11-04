const mongoose = require('mongoose');
require('dotenv').config({path:'.env'})

const conectarDB= async () => {
    try {
        await mongoose.connect(process.env.DB_MONGO,{
            //userNewUrlParser:true,
            //useUnifieldTopology: true,
            //useFindAndModify: false,
            //useCreateIndex: true
        });
        console.log('DB Conectada');
    }catch(error){
        console.log(error)
        console.log("Hubo un error al conectar a la base de datos")
        process.exit(1); //detenemos el servidor
    }
}

module.exports = conectarDB;