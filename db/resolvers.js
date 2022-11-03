const Usuario = require('../models/Usuario')
const Producto = require('../models/Producto')
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'.env'});



crearToken= (usuario,secreta)=>{
    console.log(usuario)
    const { id,email,nombre, apellido } = usuario;


    return jwt.sign({id,email,nombre,apellido},secreta,{ expiresIn: '1800s' })
}



//resolvers
const resolvers={
    Query:{
        obtenerUsuario: async (_,{token}) => {
            const usuarioId= await jwt.verify(token,process.env.SECRETA)

            return usuarioId
        },

        obtenerProductos: async ()  => {
            try {
                const productos = await Producto.find({});
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_,{id}) => { 
            
            //verificar que el producto exista
            const producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
            return producto;
        }
    },
    Mutation:{
        nuevoUsuario: async (_,{input}) => {

            const {email,password} = input;
            //revisar si el usuario ya esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario) {
                throw new Error("El usuario ya esta registrado");
            }

            // Hashear el password
            const salt = await bcryptjs.genSalt(10);
            input.password = await bcryptjs.hash(password, salt);


            try {
                // Guardar en la base de datos
                const usuario = new Usuario(input);
                usuario.save();
                return usuario;
            } catch (error) {
                console.log(error);
            }
        },
        autenticarUsuario: async(_,{input}) =>{
            
            const {email,password} = input;

            //verificar que el usuario exista
            const existeUsuario=await Usuario.findOne({email});
            if (!existeUsuario) {
                throw new Error("El usuario no existe");
            }

            //verificar password
            const passwordCorrecto = await bcryptjs.compare(password,existeUsuario.password); 
            if (!passwordCorrecto) {
                throw new Error("El password es incorrecto");
            }

            //crear token
            return{
                token : crearToken(existeUsuario,process.env.SECRETA)
            }
        },
        nuevoProducto: async(_,{input}) =>{
            try {
                const producto = new Producto(input);

                //alamacenamos en la base de datos
                const resultado = await producto.save();
                return resultado;    
            } catch (error) {
                console.log(error);
            }
        },
        actualizarProducto: async (_,{id,input}) =>{
            
            //verificar que el producto exista
            let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }
           //guardar los cambios en la base de datos
            producto = await Producto.findOneAndUpdate({_id:id},input, {new:true});
            return producto;
        },
        eliminarProducto: async(_,{id}) =>{
            //verificar que el producto exista
            let producto = await Producto.findById(id);
            if(!producto){
                throw new Error('Producto no encontrado')
            }

            await Producto.findOneAndDelete({_id:id});
            return "Producto Eliminado";

        }


    }
}

module.exports = resolvers;