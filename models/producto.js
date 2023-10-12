import { DataTypes } from 'sequelize'
import db from '../db/connection.js'

const Producto = db.define('Producto', {
    id_producto: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'id_producto', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
    nombre: {
        type: DataTypes.STRING 
    },
    tipo: {
        type: DataTypes.STRING 
    },
    precio: {
        type: DataTypes.FLOAT
    },
    stock: {
        type: DataTypes.FLOAT
    },
},
{timestamps:false,
tableName:'productos'}
)

export default Producto

