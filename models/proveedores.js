import { DataTypes } from 'sequelize'
import db from '../db/connection.js'

const Proveedor = db.define('Proveedor', {
    proveedores_id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'proveedores_id', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
    nombre: { type: DataTypes.STRING },
    
    usuario: { type: DataTypes.STRING },
    
    password: { type: DataTypes.STRING },
    
    nivel: { type: DataTypes.INTEGER },
},

{
    timestamps:false,
    tableName: 'proveedores'}
)

export default Proveedor 

