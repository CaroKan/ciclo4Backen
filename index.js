const {ApolloServer, gql} = require('apollo-server');



// Schema
const typeDefs = gql`
    type Curso{
        titulo:String
        tecnologia:String
    }

    type Query{
        obtenerCursos: Curso
    }
`;
const cursos=[
    {
        titulo:'JavaScrpt Moderno',
        tecnologia:'JavaScrpt ES6',
    },
    {
        titulo:'React',
        tecnologia:'React',
    },
    {
        titulo:'Node Moderno',
        tecnologia:'React',
    },
]

//resolver
const resolvers={
    Query:{
        obtenerCursos: () => cursos[0]
    }
}

// servidor
const server = new ApolloServer({
    typeDefs,
    resolvers
});

//arrancando el servidor
server.listen().then(({url}) => {
    console.log(`Servidor listo en la URL ${url}`)
})