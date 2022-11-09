const mongoose = require('mongoose');

const ProductoSchema = mongoose.Schema({
    pedido:{
        type: Array,
        required:true
    },
    total:{
        type: Number,
        required: true,
        trim:true
    },

    cliente:{
        type: mongoose.Schema.Types.ObjectId,
        requiried: true,
        ref: 'Cliente'
    },

    vendedor:{
        type: mongoose.Schema.Types.ObjectId,
        requiried: true,
        ref: 'Usuario'
    },

    estado:{
        type: String,
        default:"PENDIENTE"
    },
    creado:{
        type :Date,
        default: Date.now()
    }

});

    module.exports = mongoose.model('Pedido', ProductoSchema);