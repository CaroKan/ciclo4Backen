const {ApolloServer} = require('apollo-server');
const typeDefs = require('./db/schema');
const resolvers = require('./db/resolvers');
const conectarDB = require('./config/db');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'.env'});

//Conectar a la base de datos
conectarDB ();

// servidor
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req}) =>{
        //console.log(req.headers['authorization'])
        
        //si hay token lo asigno y sino se asigna cadena vacia
        const token = req.headers['authorization'] || '';
        //console.log(token)
        if (token){
            try {
                
                const usuario = jwt.verify(token,process.env.SECRETA)
            
                return {
                    usuario
                }
            } catch (error) {
                console.log("Hubo un error en la verificación del token")
                //console.log(error)
            }
        }
    }
});

//arrancando el servidor
server.listen().then(({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
})