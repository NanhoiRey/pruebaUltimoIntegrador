import { DataTypes } from 'sequelize'
import db from '../db/connection.js'

const Usuario = db.define('Usuario', {
    id_usuario: { 
        type: DataTypes.INTEGER,
        primaryKey: true, // Esto indica que es la clave primaria 
        autoIncrement: true, // Esto indica que es una columna serial
        field: 'id_usuario', // Esto especifica el nombre real de la columna en la base de datos 
    }, 
    nombre: {
        type: DataTypes.STRING 
    },
    edad: {
        type: DataTypes.INTEGER 
    },
    email: {
        type: DataTypes.STRING 
    },
    telefono: {
        type: DataTypes.STRING 
    },
    usuario: {
        type: DataTypes.STRING 
    },
    password: {
        type: DataTypes.STRING 
    },
    nivel: {
        type: DataTypes.INTEGER 
    },
},
{timestamps:false,
tableName: 'usuarios'}
)

export default Usuario

