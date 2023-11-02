import { DataTypes } from 'sequelize'
import db from '../db/connection.js'
import Cliente from './clientes.js'

const Carrito = db.define('Carrito', {
    carrito_id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'carrito_id', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
    cliente_id:{
        type: DataTypes.INTEGER,
        references: { model: 'Cliente', key: 'clientes_id', },
    },
    
    monto : { type: DataTypes.FLOAT }

},
{
    timestamps:false,
    tableName:'carritos'}
)

Carrito.belongsTo(Cliente,{ foreignKey: 'cliente_id', })
Cliente.hasMany(Carrito,{ foreignKey: 'cliente_id',})




export default Carrito

