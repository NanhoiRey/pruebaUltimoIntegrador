import { DataTypes } from 'sequelize'
import db from '../db/connection.js'
import Carrito from './carritos.js'
import Producto from './productos.js'

const Venta = db.define('Venta', {
    venta_id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'id_venta', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
    producto_id: { type: DataTypes.INTEGER,references: { model: 'Producto', key: 'producto_id', }, },
    
    carrito_id: { type: DataTypes.INTEGER, references: { model: 'Carrito', key: 'carrito_id', }},
    
    cantidad: { type: DataTypes.INTEGER }, 
    
    subtotal: { type: DataTypes.FLOAT }
},
{
    timestamps:false,
    tableName: 'ventas'}
)
Producto.hasMany(Venta, {foreignKey: 'producto_id' })
Venta.belongsTo(Producto, { foreignKey: 'producto_id'})
Venta.belongsTo(Carrito,{foreignKey: 'carrito_id'})
Carrito.hasMany(Venta, { foreignKey: 'venta_id'})



export default Venta

