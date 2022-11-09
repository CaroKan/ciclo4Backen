const Usuario = require('../models/Usuario')
const Producto = require('../models/Producto')
const Cliente = require('../models/Cliente')
const Pedido = require('../models/Pedido')


const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({path:'.env'});



crearToken= (usuario,secreta)=>{
    console.log(usuario)
    const { id,email,nombre, apellido } = usuario;


    return jwt.sign({id,email,nombre,apellido},secreta,{ expiresIn: '3600s' })
}



//resolvers
const resolvers={
    Query:{
        obtenerUsuario: async (_,{token}) => {
            console.log(token)
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
                throw new Error('Producto no encontrado');
            }
            return producto;
        },

        obtenerClientes: async ()  => {
            try {
                const clientes = await Cliente.find({});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerClientesVendedor: async (_,{},ctx)  => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString()});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerCliente: async (_,{id},ctx)  => {
            //Verificar si el cliente existe
            const cliente = await Cliente.findById({id});
            if(!cliente){
                throw new Error('Cliente no encontrado')
            }

            //Verificar quien lo creo
            if(cliente.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            return cliente;
        },

        obtenerPedidos: async () =>{
            try {
                const pedidos = await Pedido.find({});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedidosVendedor: async (_,{},ctx) =>{
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id});
                return pedidos;
            } catch (error) {
                console.log(error);
            }
        },

        obtenerPedido : async (_,{id},ctx)  => {
            //verificar si el pedido existe
            const pedido= await Pedido.findById(id);
            if (!pedido){
                throw new Error('Pedido no encontrado')
            }
            
            if(pedido.vendedor.toString()!==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            return pedido;

        },
        obtenerPedidosEstado: async (_,{estado},ctx) =>{
            const pedidos= await Pedido.find({vendedor: ctx.usuario.id,estado});

            return pedidos;
        },
        mejoresClientes: async () =>{
            const clientes = await Pedido.aggregate([
                { $match: {estado: "COMPLETADO" }},
                { $group: {
                    _id: "$cliente",
                    total: {$sum: '$total'}
                }},
                {
                    $lookup:{
                        from:'clientes',
                        localField:'_id',
                        foreignField:"_id",
                        as:"cliente"
                    }
                },
                {
                    $limit: 10
                }, 
                {
                    $sort: {total: -1}
                }
            ]);
            return clientes;
        },
        mejoresVendedores: async () => {
            const vendedores = await Pedido.aggregate([
                { $match : { estado : "COMPLETADO"} },
                { $group : {
                    _id : "$vendedor", 
                    total: {$sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'usuarios', 
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                }, 
                {
                    $limit: 3
                }, 
                {
                    $sort: { total : -1 }
                }
            ]);

            return vendedores;
        }

    },

   

    //Mutations
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

        },
        nuevoCliente : async (_, {input},ctx) => {
            console.log(ctx);
            const {email} = input
            

            //Verificar si el cleinte esta creado
            const cliente = await Cliente.findOne({email});
            if(cliente){
                throw new Error('El cliente ya existe en la base de datos')
            }

            const nuevoCliente = new Cliente(input);
            //asignar el vendedor
            nuevoCliente.vendedor=ctx.usuario.id;
            console.log("Valor del token Cliente ",nuevoCliente)
            
            //guardar en la base de datos

          try {
            
            const resultado= await nuevoCliente.save();
            return resultado;
        
            } catch (error) {
                console.log(error);
            }

        },
        
        actualizarCliente: async(_,{id, input},ctx) =>{
            // verificar si existe el cliente
            let cliente = await Cliente.findById(id);

            if(!cliente){
                throw new Error('El cliente no existe en la base de datos');
            }

            // verificar si el vendedor es quien edita
            if(cliente.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
            
            //actualziar el cliente
            cliente = await Cliente.findOneAndUpdate({_id: id}, input, {new: true})
            return cliente;
        },

        eliminarCliente: async(_,{id},ctx) =>{
            // verificar si existe el cliente
            let cliente = await Cliente.findById(id);

            if(!cliente){
                throw new Error('El cliente no existe en la base de datos');
            }

            // verificar si el vendedor es quien edita
            if(cliente.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            //eliminar el cliente
            await Cliente.findOneAndDelete({_id:id});
            return "Cliente Eliminado"
        },

        nuevoPedido: async (_,{input},ctx)=>{
            
            const {cliente} = input
            // verificar si el cliente existe

            let clienteExiste = await Cliente.findById(cliente);

            if(!clienteExiste){
                throw new Error('El cliente no existe en la base de datos');
            }

            //verificar si el cliente es del vendedor
            if(clienteExiste.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
            
            //verificar stock
            for await (const articulo of input.pedido){
                const {id}= articulo;

                const producto =await Producto.findById(id);

                if (articulo.cantidad > producto.existencia){
                    throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                }else{
                    //restar al inventario la cantidad solicitada
                    producto.existencia=producto.existencia - articulo.cantidad;
                    await producto.save();
                }
            }

            //Crear un nuevo Pedido
            const nuevoPedido = new Pedido(input);

            //asignarle un vendedor
            nuevoPedido.vendedor= ctx.usuario.id;

            //guardarlo en la base de datos
            const resultado = await nuevoPedido.save();
            return resultado;


        },

        actualizarPedido: async(_,{id,input},ctx) =>{

            const {cliente} = input;
            //console.log("Iniciamos");
            //verificar si el pedido existe
            const existePedido = await Pedido.findById(id);
            if(!existePedido){
                throw new Error('El pedido no existe')
            }
            
            // verificar si el cliente existe
            const existeCliente = await Cliente.findById(cliente);
            if(!existeCliente){
                throw new Error('El Cliente no existe')
            }
            
            //Verificar si el cliente y pedido pertenece al vendedor
            if(existeCliente.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }
           
            // revisar el stock
            if( input.pedido ) {
                for await ( const articulo of input.pedido ) {
                    const { id } = articulo;
    
                    const producto = await Producto.findById(id);
    
                    if(articulo.cantidad > producto.existencia) {
                        throw new Error(`El articulo: ${producto.nombre} excede la cantidad disponible`);
                    } else {
                        // Restar la cantidad a lo disponible
                        producto.existencia = producto.existencia - articulo.cantidad;
    
                        await producto.save();
                    }
                }
            }
            
            //actualizar el pedido
            const resultado = await Pedido.findOneAndUpdate({_id:id},input,{new:true});
            return resultado;
        },

        eliminarPedido: async(_,{id},ctx) =>{
            // verificar si existe el pedido
            let pedido = await Pedido.findById(id);

            if(!pedido){
                throw new Error('El pedido no existe en la base de datos');
            }

            // verificar si el vendedor es quien elimina
            if(pedido.vendedor.toString() !==ctx.usuario.id){
                throw new Error('No tienes las credenciales')
            }

            //eliminar el pedido
            await Pedido.findOneAndDelete({_id:id});
            return "Pedido Eliminado"
        }    
    }
}

module.exports = resolvers;