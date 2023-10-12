import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const datos = require('./datos.json')

import express from 'express'
import db from './db/connection.js'
import Producto from './models/producto.js'
import Usuario from './models/usuario.js'

const html = '<h1>Bienvenido a la API</h1><p>Los comandos disponibles son:</p><ul><li>GET: /productos/</li><li>GET: /productos/id</li>    <li>POST: /productos/</li>    <li>DELETE: /productos/id</li>    <li>PUT: /productos/id</li>    <li>PATCH: /productos/id</li>    <li>GET: /usuarios/</li>    <li>GET: /usuarios/id</li>    <li>POST: /usuarios/</li>    <li>DELETE: /usuarios/id</li>    <li>PUT: /usuarios/id</li>    <li>PATCH: /usuarios/id</li>    <li>GET: /usuarios/telefono/id</li>   </ul>  '

const app = express()

const exposedPort = 1234

app.get('/', (req, res) => {
    res.status(200).send(html)
})

// 10)  obtener el total del stock actual de productos, la sumatoria de los precios individuales.
app.get('/productos/total', async (req, res) => {
    try {

        const productos = await Producto.findAll();
        const precioTotal = productos.reduce((total, producto) => total + producto.precio, 0);
        const stockTotal = productos.reduce((total, producto) => total + producto.stock, 0);


        res.status(200).json({
            "Stock total" : stockTotal,
            "Precios sumados" : precioTotal,
        })

    } catch (error) {
        res.status(204).json({"message": error})
    }
})



app.get('/productos/', async (req, res) => {
    try {
        let allProducts =   await Producto.findAll()

        res.status(200).json(allProducts)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})

app.get('/productos/:id', async (req, res) => {
    try {
        let productoId = parseInt(req.params.id)
        let productoEncontrado = await Producto.findByPk(productoId)

        res.status(200).json(productoEncontrado)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})

app.post('/productos', (req, res) => {
    try {
        let bodyTemp = ''

        req.on('data', (chunk) => {
            bodyTemp += chunk.toString()
        })
    
        req.on('end', async () => {
            const data = JSON.parse(bodyTemp)
            req.body = data
            //datos.productos.push(req.body)
            const productoAGuardar = new Producto(req.body)
            await productoAGuardar.save()
        })
    
        res.status(201).json({"message": "success"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

app.patch('/productos/:id', async (req, res) => {
    let idProductoAEditar = parseInt(req.params.id)
    try {
        let productoAActualizar = await Producto.findByPk(idProductoAEditar)

        if (!productoAActualizar) {
            return res.status(204).json({"message":"Producto no encontrado"})}

        let bodyTemp = ''

        req.on('data', (chunk) => {
            bodyTemp += chunk.toString()
        })

        req.on('end', async () => {
            const data = JSON.parse(bodyTemp)
            req.body = data
        
            await productoAActualizar.update(req.body)

            res.status(200).send('Producto actualizado')
        })
    
    } catch (error) {
        res.status(204).json({"message":"Producto no encontrado"})
    }
})

app.delete('/productos/:id', async (req, res) => {
    let idProductoABorrar = parseInt(req.params.id)
    try {
        let productoABorrar = await Producto.findByPk(idProductoABorrar);
        if (!productoABorrar){
            return res.status(204).json({"message":"Producto no encontrado"})
        }

        await productoABorrar.destroy()
        res.status(200).json({message: 'Producto borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
})

// 6) Obtención  el precio a partir de un id
app.get('/productos/precio/:id', async (req, res) => {
    try {
        let precioId = parseInt(req.params.id)
        let precioEncontrado = await Producto.findByPk(precioId)

        if (!precioEncontrado){
            res.status(204).json({"message" : "Producto no encontrado"})
        }
        res.status(200).json({ "Precio" : precioEncontrado.precio})
    } catch (error) {
        res.status(204).json({"message": error})
    }
})

// 7) Obtener el nombre de un producto que se indica por id.
app.get('/productos/nombre/:id', async (req, res) => {
    try {
        let nombreId = parseInt(req.params.id)
        let nombreEncontrado = await Producto.findByPk(nombreId)

        if (!nombreEncontrado){
            res.status(204).json({"message" : "Nombre no encontrado"})
        }
        res.status(200).json({ "nombre" : nombreEncontrado.nombre})
    } catch (error) {
        res.status(204).json({"message": error})
    }
})




// USUARIOS 
// ### 1 Obtención de todos los usuarios
app.get('/usuarios/', async (req, res) => {
    try {
        
        let allUsers =   await Usuario.findAll()

        res.status(200).json(allUsers)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// ### 2) Obtención de un usuario desde un id
app.get('/usuarios/:id', async (req, res) => {
    try {
        let ususarioId = parseInt(req.params.id)
        let usuarioEncontrado = await Usuario.findByPk(ususarioId)

        res.status(200).json(usuarioEncontrado)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})

// ### 3) Crear un nuevo usuario
app.post('/usuarios', (req, res) => {
    try {
        let bodyTemp = ''

        req.on('data', (chunk) => {
            bodyTemp += chunk.toString()
        })
    
        req.on('end', async () => {
            const data = JSON.parse(bodyTemp)
            req.body = data
            //datos.productos.push(req.body)
            const usuarioAGuardar = new Usuario(req.body)
            await usuarioAGuardar.save()
        })
    
        res.status(201).json({"message": "success"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

// ### 4) Actualización de un usuario, el body lleva solo el atributo a modificar
app.patch('/usuarios/:id', async (req, res) => {
    let idUsuarioAEditar = parseInt(req.params.id)
    try {
        let usuarioAActualizar = await Usuario.findByPk(idUsuarioAEditar)

        if (!usuarioAActualizar) {
            return res.status(204).json({"message":"Usuario no encontrado"})}

        let bodyTemp = ''

        req.on('data', (chunk) => {
            bodyTemp += chunk.toString()
        })

        req.on('end', async () => {
            const data = JSON.parse(bodyTemp)
            req.body = data
        
            await usuarioAActualizar.update(req.body)

            res.status(200).send('Usuario actualizado')
        })
    
    } catch (error) {
        res.status(204).json({"message":"Usuario no encontrado"})
    }
})

// ### 5) Borrado de un usuario
app.delete('/usuarios/:id', async (req, res) => {
    let idUsuarioABorrar = parseInt(req.params.id)
    try {
        let usuarioABorrar = await Usuario.findByPk(idUsuarioABorrar);
        if (!usuarioABorrar){
            return res.status(204).json({"message":"Usuario no encontrado"})
        }

        await usuarioABorrar.destroy()
        res.status(200).json({message: 'Usario borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
})

// 8) Obtener el telefono de un usuario que se indica por id.
app.get('/usuarios/telefono/:id', async (req, res) => {
    try {
        let telId = parseInt(req.params.id)
        let telefonoEncontrado = await Usuario.findByPk(telId)

        if (!telefonoEncontrado){
            res.status(204).json({"message" : "Nombre no encontrado"})
        }
        res.status(200).json({ "Telefono del id" : telefonoEncontrado.telefono})
    } catch (error) {
        res.status(204).json({"message": error})
    }
})

// ### 9) Obtener el nombre de un usuario que se indica por id.
app.get('/usuarios/nombre/:id', async (req, res) => {
    try {
        let nombreId = parseInt(req.params.id)
        let nombreEncontrado = await Usuario.findByPk(nombreId)

        if (!nombreEncontrado){
            res.status(204).json({"message" : "Nombre no encontrado"})
        }
        res.status(200).json({ "nombre del id" : nombreEncontrado.nombre})
    } catch (error) {
        res.status(204).json({"message": error})
    }
})






// MODELO
app.use((req, res) => {
    res.status(404).send('<h1>404</h1>')
})

try {
    await db.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }

app.listen( exposedPort, () => {
    console.log('Servidor escuchando en http://localhost:' + exposedPort)
})




