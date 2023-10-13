import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const datos = require('./datos.json')

import express from 'express'
import jwt from 'jsonwebtoken'

import db from './db/connection.js'
import Producto from './models/producto.js'
import Usuario from './models/usuario.js'

const html = '<h1>Bienvenido a la API</h1><p>Los comandos disponibles son:</p><ul><li>GET: /productos/</li><li>GET: /productos/id</li>    <li>POST: /productos/</li>    <li>DELETE: /productos/id</li>    <li>PUT: /productos/id</li>    <li>PATCH: /productos/id</li>    <li>GET: /usuarios/</li>    <li>GET: /usuarios/id</li>    <li>POST: /usuarios/</li>    <li>DELETE: /usuarios/id</li>    <li>PUT: /usuarios/id</li>    <li>PATCH: /usuarios/id</li>    <li>GET: /usuarios/telefono/id</li>   </ul>  '

const app = express()

const exposedPort = 1234

//Middleware para la validaciond e los token recibidos
function autenticacionDeToken(req, res, next){
    const headerAuthorization = req.headers['authorization']

    const tokenRecibido = headerAuthorization.split(" ")[1]

    if (tokenRecibido == null){
        return res.status(401).json({message : 'Token inválido'})
    }

    let payload = null
    
    try {
        //Intentamos sacar los datos del payload del token
        payload = jwt.verify(tokenRecibido, process.env.SECRET_KEY)

        
    } catch (error) {
        return res.status(401).json({message : 'Token inválido'})
        
    }

    if (Date.now() > payload.exp){
        return res.status(401).json({message :  'Token caducado'})
    }

    //Pasó validaciones
    req.user = payload.sub

    next()
}


//Middleware que construye body en req de tipo post y patch
app.use((req, res, next) =>{
    if ((req.method !== 'POST') && (req.method !== 'PATCH')) {return next()}

    if (req.headers['content-type'] !== 'application/json') { return next()}

    let bodyTemp = ''

    req.on('data', (chunk) => {
        bodyTemp += chunk.toString()
    })

    req.on('end', () => {
        req.body = JSON.parse(bodyTemp)
        next()
    })
})


app.get('/', (req, res) => {
    res.status(200).send(html)
})


//Endpoints para la validacion de los datos 
app.post('/auth', async (req, res) => {
    
    //obtencion datos 
    const usuarioABuscar = req.body.usuario
    const passwordRecibido = req.body.password

    let usuarioEncontrado = ''

    //Comprobar usuario
    try {
        usuarioEncontrado = await Usuario.findAll({where:{usuario:usuarioABuscar}})

        if(usuarioEncontrado == ''){ return res.status(400).json({message:'Usuario no encontrado'}) }
    } catch (error) {
        return res.status(400).json({message: 'Usuario no encontrado'})
    }

    //Comprobar password
    if (usuarioEncontrado[0].password !== passwordRecibido){
        return res.status(400).json({message: 'Password Incorrecto'})
    }

    // Generacion token
    const sub = usuarioEncontrado[0].id
    const usuario = usuarioEncontrado[0].usuario
    const nivel = usuarioEncontrado[0].nivel

    //firma y construccion de firma 
    const token = jwt.sign({
        sub,
        usuario,
        nivel,
        exp: Date.now() + (60 * 1000)
    },process.env.SECRET_KEY)

    res.status(200).json({ accesToken: token })

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


// ### 1 Obtención de todos los productos

app.get('/productos/', async (req, res) => {
    try {
        let allProducts =   await Producto.findAll()

        res.status(200).json(allProducts)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// ###  Obtención de producto dado un id 

app.get('/productos/:id', async (req, res) => {
    try {
        let productoId = parseInt(req.params.id)
        let productoEncontrado = await Producto.findByPk(productoId)

        res.status(200).json(productoEncontrado)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})

// ###  Agregar producto

app.post('/productos', autenticacionDeToken, async (req, res) => {
    try {
       
        //datos.productos.push(req.body)
        const productoAGuardar = new Producto(req.body)
        await productoAGuardar.save()

        res.status(201).json({"message": "success"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

// ### Modificiar producto

app.patch('/productos/:id',autenticacionDeToken, async (req, res) => {
    let idProductoAEditar = parseInt(req.params.id)
    try {
        let productoAActualizar = await Producto.findByPk(idProductoAEditar)

        if (!productoAActualizar) {
            return res.status(204).json({"message":"Producto no encontrado"})}
        
            await productoAActualizar.update(req.body)

            res.status(200).send('Producto actualizado')

    } catch (error) {
        res.status(204).json({"message":"Producto no encontrado"})
    }
})

// ### Borrar producto

app.delete('/productos/:id', autenticacionDeToken,  async (req, res) => {
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
app.post('/usuarios',autenticacionDeToken, async (req, res) => {
    try {
        const usuarioAGuardar = new Usuario(req.body)
        await usuarioAGuardar.save()        

        res.status(201).json({"message": "success"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

// ### 4) Actualización de un usuario, el body lleva solo el atributo a modificar
app.patch('/usuarios/:id',autenticacionDeToken, async (req, res) => {
    let idUsuarioAEditar = parseInt(req.params.id)
    try {
        let usuarioAActualizar = await Usuario.findByPk(idUsuarioAEditar)

        if (!usuarioAActualizar) {
            return res.status(204).json({"message":"Usuario no encontrado"})}


        req.on('end', async () => {
            
        
            await usuarioAActualizar.update(req.body)

            res.status(200).send('Usuario actualizado')
        })
    
    } catch (error) {
        res.status(204).json({"message":"Usuario no encontrado"})
    }
})

// ### 5) Borrado de un usuario
app.delete('/usuarios/:id', autenticacionDeToken, async (req, res) => {
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




