const { gql} = require('apollo-server');

// Schema
const typeDefs = gql`

    type Usuario {
        id:ID
        nombre: String
        apellido: String
        email: String
        creado: String
    }
     type Token {
        token: String
     }

     type Producto{
        id:ID
        nombre: String
        existencia: Int
        precio: Float
        creado: String
     }

    input UsuarioInput{
        nombre: String!
        apellido: String!
        email: String!
        password: String!
    }

    input AutenticarInput{
        email: String!
        password: String!
    }

    input ProductoInput{
        nombre: String!
        existencia: Int!
        precio: Float!
    }

    type Query{
        # Obtener usuarios
        obtenerUsuario(token: String!): Usuario

        # Obtener productos
        obtenerProductos: [Producto]
        obtenerProducto(id:ID!): Producto
    }

    type Mutation{

        #Mutation para los usuarios
        nuevoUsuario(input: UsuarioInput): Usuario
        autenticarUsuario(input:AutenticarInput): Token

        #Mutations para los productos
        nuevoProducto(input: ProductoInput) : Producto
        actualizarProducto(id:ID!, input : ProductoInput) : Producto
        eliminarProducto(id:ID!) : String
    }
`;

module.exports =typeDefs;