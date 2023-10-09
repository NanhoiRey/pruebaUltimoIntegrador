import { Sequelize } from 'sequelize'

// Creación de la instancia de Sequelize
const db = new Sequelize(
    'fmnkpalr', // DB name
    'fmnkpalr', // User
    'Yj5a4IUOwyr2EaNxbp00GHyheoBETmLI', // Password
    {
  host: 'silly.db.elephantsql.com',
  dialect: 'postgres',
  logging: true
})

export default db

