import { DataTypes } from 'sequelize'
import db from '../db/connection.js'
import Proveedor from './proveedores.js'

const Producto = db.define('Producto', {
    producto_id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'producto_id', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
 
    proveedores_id: { type: DataTypes.INTEGER, references: { model: 'Proveedor', key: 'proveedores_id', },},
 
    nombre: {type: DataTypes.STRING },
 
    precio: {type: DataTypes.FLOAT},

    stock: {type: DataTypes.BIGINT},

},
{
    timestamps:false,
    tableName:'productos'
})

Producto.belongsTo(Proveedor,{foreignKey: 'proveedores_id',})
Proveedor.hasMany(Producto,{foreignKey: 'proveedores_id',})

export default Producto

