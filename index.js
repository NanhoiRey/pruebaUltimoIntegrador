import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

import express from 'express'
import jwt from 'jsonwebtoken'

import db from './db/connection.js'

import Cliente from './models/clientes.js'
import Producto from './models/productos.js'
import Carrito from './models/carritos.js'
import Administrador from './models/administradores.js'
import Proveedor from './models/proveedores.js'
import Venta from './models/ventas.js'

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
    req.nivelDelUsuario = payload.nivel
    req.usuario = payload.usuario

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
app.post('/auth', async (req, res,) => {
    const usuarioABuscar = req.body.usuario
    const passwordRecibido = req.body.password
    let usuarioEncontrado = ''
    //Comprobar usuario
    try {
        usuarioEncontrado = await Administrador.findAll({where:{usuario:usuarioABuscar}})
        if(usuarioEncontrado == ''){ 

            usuarioEncontrado = await Cliente.findAll({where:{usuario:usuarioABuscar}})
            if(usuarioEncontrado == ''){ 

                usuarioEncontrado = await Proveedor.findAll({where:{usuario:usuarioABuscar}})
                if(usuarioEncontrado == ''){ 
                    return res.status(400).json({message:'Usuario no encontrado'}) 
                }
            }
        }
        
    } catch (error) {
        return res.status(400).json({message: 'Usuario no encontrado'})
    }
    //Comprobar password
    if (usuarioEncontrado[0].password !== passwordRecibido){
        return res.status(400).json({message: 'Password Incorrecto'})
    }

    console.log(usuarioEncontrado)
    ///Compruebo que tipo de usuario es asi guardo el id. Las tres tablas de usuarios tienen distintos nombres, impidendo aplicar un ".id  en la generacion del token"


    // Generacion token
    const sub = usuarioEncontrado[0].id
    const usuario = usuarioEncontrado[0].usuario
    const nivel = usuarioEncontrado[0].nivel

    //firma y construccion de firma 
    const token = jwt.sign({
        sub,
        usuario,
        nivel,
        exp: Date.now() + (10000 * 1000)
    },process.env.SECRET_KEY)

    res.status(200).json({ accesToken: token })
})







// ------> PROUCTOS <------

// ### Obtención de todos os productos - (Pueden acceder todos)
app.get('/productos/', async (req, res) => {
    
    try {
        let allProducts =   await Producto.findAll()

        res.status(200).json(allProducts)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})

// ### Agregado de un producto nuevo (Solo Usuario 3 "Administrador") // Se envia el id del proveedor correspondiente
app.post('/productosAgregar/:id', autenticacionDeToken, async (req, res) => {

    
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }

    try {
        // Capturo el id ingresado por ruta  
        let idProveedor = parseInt(req.params.id)  
        // Busco el id en la tabla Proveedor  
        let idProveedorProducto = await Proveedor.findByPk(idProveedor);

        if (!idProveedorProducto){
            return res.status(400).json({message:"Proveedor no encontrado"})
        }

        const productoAGuardar = new Producto(req.body)
        productoAGuardar.proveedores_id = idProveedorProducto.proveedores_id
        await productoAGuardar.save()

        res.status(201).json({"message": "Nuevo producto cargado con exito!"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

// ### Modificar cantidad de stock de un producto ingresado en id 
// (Tiene que ser nivel 2 y tener relacion con el proveedor correspondiente el id_proveedor)
app.patch('/productosStock/:id',autenticacionDeToken, async (req, res) => {

    console.log(req.usuario)



    // Solo Proveedor Usuario 2 
    if (req.nivelDelUsuario !==2) {
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        let idProductoAEditar = parseInt(req.params.id)
        let productoAActualizar = await Producto.findByPk(idProductoAEditar)


        if (!productoAActualizar) {
            return res.status(204).json({"message":"Producto no encontrado"})
        }

        await productoAActualizar.update(req.body)

        res.status(200).send('Producto actualizado')
        
            
    } catch (error) {
        res.status(204).json({"message":"Producto no encontrado"})
    }
})


// ### Borrado de un producto (Solo Usuario 3 "Administrador")
app.delete('/productosBorrar/:id', autenticacionDeToken,  async (req, res) => {

    let idProductoABorrar = parseInt(req.params.id)
        
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
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


// 6) Obtener el precio de un producto que se indica por id (Pueden acceder todos)
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




// ------>TAREAS DE ADM <------

// Ver todos los ADM Cargados 
app.get('/administradores/',autenticacionDeToken, async (req, res) => {
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        
        let allUsers =   await Administrador.findAll()

        res.status(200).json(allUsers)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// Ver todos los Clientes 
app.get('/todosClientes/',autenticacionDeToken, async (req, res) => {
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        
        let allUsers =   await Cliente.findAll()

        res.status(200).json(allUsers)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// Ver todos los Proveedores 
app.get('/todosProveedores/',autenticacionDeToken, async (req, res) => {
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        
        let allUsers =   await Proveedor.findAll()
        res.status(200).json(allUsers)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// Crear un nuevo Proveedor
app.post('/nuevoProovedor', autenticacionDeToken, async (req, res) => {
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        const usuarioAGuardar = new Proveedor(req.body)
        usuarioAGuardar.nivel = 2
        await usuarioAGuardar.save()        

        res.status(201).json({"message": "Proveedor Creado Correctamente!"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})
// Borrar Proveedor por ID
app.delete('/borrarProveedor/:id', autenticacionDeToken, async (req, res) => {
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    let idUsuarioABorrar = parseInt(req.params.id)
    try {
        let usuarioABorrar = await Proveedor.findByPk(idUsuarioABorrar);
        if (!usuarioABorrar){
            return res.status(204).json({"message":"Proveedor no encontrado"})
        }

        await usuarioABorrar.destroy()
        res.status(200).json({message: 'Proveedor borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
})
//Borrar Cliente por ID
app.delete('/borrarCliente/:id', autenticacionDeToken, async (req, res) => {
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    let idUsuarioABorrar = parseInt(req.params.id)
    try {
        let usuarioABorrar = await Cliente.findByPk(idUsuarioABorrar);
        if (!usuarioABorrar){
            return res.status(204).json({"message":"Cliente no encontrado"})
        }

        await usuarioABorrar.destroy()
        res.status(200).json({message: 'Cliente borrado'})

    } catch (error) {
        res.status(204).json({message: error})
    }
})


// -----> TAREAS DE CLIENTES  <--------

// ### 3) Crear un nuevo usuario Cliente Nivel 1 Todos pueden
app.post('/nuevoCliente', async (req, res) => {
    try {
        const nuevoCLiente = new Cliente(req.body)
        nuevoCLiente.nivel = 1
        await nuevoCLiente.save()       

        res.status(201).json({"message": "success"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})

// ### Hacer compra producto y enviar a ventas  
// (acá se ingresa la cantidad deseada y el id del producto elegido)
app.post('/nuevaCompra', autenticacionDeToken, async (req, res) => {

    
    if (req.nivelDelUsuario !==1){
        return res.status(400).json({message:'El usuario ingresado no es un cliente'})
    }

    try {
        
        const nuevoCarrito = new Carrito

            nuevoCarrito.clienteid = req.nivelDelUsuario

            nuevoCarrito.monto = 

        await nuevoCarrito.save()
        
        const ventaAGuardar = new Venta(req.body)


            ventaAGuardar.subotal = ventaAGuardar.producto_id.precio * ventaAGuardar.cantidad

        await ventaAGuardar.save()



        res.status(201).json({"message": "Nuevo producto cargado con exito!"})

    } catch (error) {
        res.status(204).json({"message": "error"})
    }
})






// ### Obtención de un Cliente desde un id (Solo ADM )
app.get('/usuarios/:id',autenticacionDeToken, async (req, res) => {
    
    // Solo Administrador
    if (req.nivelDelUsuario !==3){
        return res.status(400).json({message:'Usuario no habilitado para esta accion'})
    }
    try {
        let ususarioId = parseInt(req.params.id)
        let usuarioEncontrado = await Cliente.findByPk(ususarioId)

        res.status(200).json(usuarioEncontrado)

    } catch (error) {
        res.status(204).json({"message": error})
    }
})
// // ### 3) Crear un nuevo usuario Cliente nivel 1 Todos pueden
// app.post('/usuarios/nuevoCliente', async (req, res) => {

//     try {
//         const usuarioAGuardar = new Usuario(req.body)
//         // Se define que nivel será cargado independiente de que valor se coloque en la consulta.http
//         usuarioAGuardar.nivel = 1
//         await usuarioAGuardar.save()        

//         res.status(201).json({"message": "success"})

//     } catch (error) {
//         res.status(204).json({"message": "error"})
//     }
// })
// // ### 4) Crear un nuevo PROVEDOR  (Solo ADM Puede generarlo)
// app.post('/usuarios/nuevoProovedor', autenticacionDeToken, async (req, res) => {
//     // Solo Administrador
//     if (req.nivelDelUsuario !==3){
//         return res.status(400).json({message:'Usuario no habilitado para esta accion'})
//     }
//     try {
//         const usuarioAGuardar = new Usuario(req.body)
//         // Se define que nivel será cargado independiente de que valor se coloque en la consulta.http
//         usuarioAGuardar.nivel = 2
//         await usuarioAGuardar.save()        

//         res.status(201).json({"message": "success"})

//     } catch (error) {
//         res.status(204).json({"message": "error"})
//     }
// })
// // ### 5) Actualización de un usuario (Solo ADM )
// app.patch('/usuariosModificar/:id',autenticacionDeToken, async (req, res) => {
    
//     // Solo Administrador
//     if (req.nivelDelUsuario !==3){
//         return res.status(400).json({message:'Usuario no habilitado para esta accion'})
//     }
//     let idUsuarioAEditar = parseInt(req.params.id)

//     if (req.nivelDelUsuario !==3){
//         return res.status(400).json({message:'Usuario no habilitado para esta accion'})
//     }
//     try {
//         let usuarioAActualizar = await Usuario.findByPk(idUsuarioAEditar)

//         if (!usuarioAActualizar) {
//             return res.status(204).json({"message":"Producto no encontrado"})}
        
//             await usuarioAActualizar.update(req.body)

//             res.status(200).send('Usuario Actualizado')

//     } catch (error) {
//         res.status(204).json({"message":"Producto no encontrado"})
//     }
// })




// // ------> CARRITOS <------

// // 1) Se crea un carrito
// app.post('/carritos/nuevo', async (req, res) => {

//     try {
//         const carritoAGuardar = new Carrito(req.body)
//         await carritoAGuardar.save()        
//         res.status(201).json({"message": "success"})

//     } catch (error) {
//         res.status(204).json({"message": "error"})
//     }
// })

// // ###  Agregar al carrito un producto carrito
// app.post('/carrito/id:/id:', async (req, res) => {
//     try {
//         const carritoAGuardar = new Carrito(req.body)
//         await carritoAGuardar.save()

//         res.status(201).json({"message": "success"})

//     } catch (error) {
//         res.status(204).json({"message": "error"})
//     }
// })

// // Obtener el nombre de un carrito que se indica por id.
// app.get('/carritoEncontrar/:id', async (req, res) => {
//     try {
//         let nombreId = parseInt(req.params.id)
//         let nombreEncontrado = await Carrito.findByPk(nombreId)

//         if (!nombreEncontrado){
//             res.status(204).json({"message" : "Nombre no encontrado"})
//         }
//         res.status(200).json({ "nombre" : nombreEncontrado.nombre})
//     } catch (error) {
//         res.status(204).json({"message": error})
//     }
// })

// // Devuelve todos los carritos
// app.get('/carritosTodos/', async (req, res) => {
//     try {
//         let allCarritos =   await Carrito.findAll()

//         res.status(200).json(allCarritos)

//     } catch (error) {
//         res.status(204).json({"message": error})
//     }
// })


// // ### Modificiar carrito
// app.patch('/modificarCarrito/:id',  async (req, res) => {
//     let idCarritoAEditar = parseInt(req.params.id)
//     try {
//         let carritotoAActualizar = await Carrito.findByPk(idCarritoAEditar)

//         if (!carritotoAActualizar) {
//             return res.status(204).json({"message":"Producto no encontrado"})}
        
//             await carritotoAActualizar.update(req.body)

//             res.status(200).send('Producto actualizado')

//     } catch (error) {
//         res.status(204).json({"message":"Producto no encontrado"})
//     }
// })








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




