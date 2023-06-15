'use strict'

const Hapi = require('@hapi/hapi')
const Inert = require("@hapi/inert")
const path = require('path')
const Connection = require('./dbconfig')
const fs = require("fs")
const helper = require('./helper')
const md5 = require('js-md5')
const env = require('./env')
const SUCCESS = "SUCCESS"
const ERROR = "ERROR"
const tf = require('@tensorflow/tfjs');


const init = async () => {

    const server = Hapi.Server({
        host: env.SERVER_HOST,
        port: env.SERVER_PORT,
        routes : {
            files : {
                relativeTo: path.join(__dirname, 'uploads')
            }
        }
    })

    await server.register([
        {
            plugin : Inert
        },
        {
            plugin : require("@hapi/vision")
        }
    ])

    server.views({
        engines:{
            hbs: require('handlebars')
        },
        path: path.join(__dirname, 'views'),
        layout: 'default'
    })


    server.route([

        {
            path: '/auth/login',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var email = request.payload.email
                if(!email) return helper.compose(h, ERROR, `Parameter tidak lengkap (email)`)
                var password = request.payload.password
                if(!password) return helper.compose(h, ERROR, `Parameter tidak lengkap (password)`)

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM user WHERE USER_EMAIL = ? AND USER_PASSWORD = ?
                `, [email, password])

                var user = qry[0]
                if(user.length == 0){
                    return helper.compose(h, ERROR, `Mohon periksa kembali email dan/atau password anda`, data)
                }

                var data = {
                    user : user[0]
                }
                return helper.compose(h, SUCCESS, `Selamat datang, ${data.user.USER_FULLNAME}`, data)
            }
        },

        {
            path: '/auth/update',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var email = request.payload.email
                if(!email) return helper.compose(h, ERROR, `Parameter tidak lengkap (email)`)
                var password = request.payload.password
                if(!password) return helper.compose(h, ERROR, `Parameter tidak lengkap (password)`)
                var phone = request.payload.phone
                if(!phone) return helper.compose(h, ERROR, `Parameter tidak lengkap (phone)`)
                var fullname = request.payload.fullname
                if(!fullname) return helper.compose(h, ERROR, `Parameter tidak lengkap (fullname)`)
                var address = request.payload.address
                if(!address) return helper.compose(h, ERROR, `Parameter tidak lengkap (address)`)
                var new_password = request.payload.new_password

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM user WHERE USER_EMAIL = ? AND USER_PASSWORD = ?
                `, [email, password])

                var user = qry[0]
                if(user.length == 0){
                    return helper.compose(h, ERROR, `Mohon periksa kembali email dan/atau password anda`, data)
                }

                var stringQry = `
                    UPDATE user SET USER_PHONE = ?, USER_FULLNAME = ?, USER_ADDRESS = ? 
                `
                var params = []
                params.push(phone)
                params.push(fullname)
                params.push(address)
                if(new_password){
                    stringQry += `
                        , USER_PASSWORD = ? 
                    `
                    params.push(new_password)
                }
                stringQry += `
                    WHERE USER_EMAIL = ?
                `
                params.push(email)
                qry = await Connection.raw2(stringQry, params)

                var data = {
                    
                }
                return helper.compose(h, SUCCESS, `Berhasil memperbarui profil`, data)
            }
        },

        {
            path: '/auth/register',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var email = request.payload.email
                if(!email) return helper.compose(h, ERROR, `Parameter tidak lengkap (email)`)
                var password = request.payload.password
                if(!password) return helper.compose(h, ERROR, `Parameter tidak lengkap (password)`)
                var phone = request.payload.phone
                if(!phone) return helper.compose(h, ERROR, `Parameter tidak lengkap (phone)`)
                var role = request.payload.role
                if(!role) return helper.compose(h, ERROR, `Parameter tidak lengkap (role)`)

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM user WHERE USER_EMAIL = ?
                `, [email])
                var user = qry[0]

                if(user.length > 0){
                    return helper.compose(h, ERROR, `Maaf, email ${email} sudah digunakan`)
                }

                qry = await Connection.raw2(`
                    INSERT INTO user (USER_EMAIL, USER_PHONE, USER_PASSWORD, USER_ROLE) VALUES (?, ?, ?, ?)
                `, [email, phone, password, role])

                return helper.compose(h, SUCCESS, `Berhasil register`)
            }
        },

        {
            path: '/fruit/classify',
            method: 'POST',
            options: {
                payload: {
                    multipart: true,
                    output: 'stream',
                    parse: true,
                    maxBytes: 10485760
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var image = request.payload.image
                if(!image) return helper.compose(h, ERROR, `Parameter tidak lengkap (image)`)
                //console.log(image)

                var fileData = image.hapi
                //console.log(fileData)
                var filename = fileData.filename
                var arrFilename = filename.split(".")
                if(arrFilename.length == 0){
                    return helper.compose(h, ERROR, `File tidak valid`)
                }
                var fileExtension = arrFilename[arrFilename.length - 1]

                var datetime = new Date()
                var filename = "image-" + md5(datetime.toString()) + "." + fileExtension

                var buffer = Buffer.from(image._data, 'hex')
                fs.writeFile('uploads/' + filename, buffer, (err) => {
                    if(err) console.log(err)
                })

                var file = fs.statSync("uploads/" + filename)
                //console.log(file)

                var fileSizeInBytes = file.size;
                var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
                //console.log(fileSizeInMegabytes)

                if(fileSizeInMegabytes > 10){
                    return helper.compose(h, ERROR, `Ukuran file maksimal 10 MB`)
                }

                // do machine learning prediction

                var data = {
                    filename : filename,
                    fruit : null,
                    quality : "GOOD",
                    price_estimation : 0
                }

                return helper.compose(h, SUCCESS, `Klasifikasi gambar`, data)
            }
        },

        {
            path: '/product/list',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var search = request.payload.search
                var user_id = request.payload.user_id

                var stringQry = `SELECT * FROM product as A JOIN fruit as B ON A.FRUIT_ID = B.FRUIT_ID JOIN user as C ON A.USER_ID = C.USER_ID `
                var params = []
                if(user_id){
                    stringQry += `WHERE A.USER_ID = ? `
                    params.push(user_id)
                }
                if(search && search.trim() != ""){
                    stringQry += `AND(A.PRODUCT_NAME LIKE ? OR A.PRODUCT_DESCRIPTION LIKE ?) `
                    var aParam = "%" + search + "%"
                    params.push(aParam)
                    params.push(aParam)
                }

                var qry
                qry = await Connection.raw2(stringQry, params)

                var data = {
                    product : qry[0]
                }
                return helper.compose(h, SUCCESS, `List produk`, data)
            }
        },

        {
            path: '/product/detail',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var product_id = request.payload.product_id
                if(!product_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (product_id)`)

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM product as A JOIN fruit as B ON A.FRUIT_ID = B.FRUIT_ID JOIN user as C ON A.USER_ID = C.USER_ID WHERE A.PRODUCT_ID = ?
                `, [product_id])

                if(qry[0].length == 0){
                    return helper.compose(h, ERROR, `Ops.. produk tidak ditemukan`)
                }

                var data = {
                    product : qry[0][0]
                }
                return helper.compose(h, SUCCESS, `Detail produk`, data)
            }
        },

        {
            path: '/product/manage/create',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var fruit_id = request.payload.fruit_id
                if(!fruit_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (fruit_id)`)
                var user_id = request.payload.user_id
                if(!user_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (user_id)`)
                var name = request.payload.name
                if(!name) return helper.compose(h, ERROR, `Parameter tidak lengkap (name)`)
                var description = request.payload.description
                if(!description) return helper.compose(h, ERROR, `Parameter tidak lengkap (description)`)
                var price = request.payload.price
                if(!price) return helper.compose(h, ERROR, `Parameter tidak lengkap (price)`)
                var unit = request.payload.unit
                if(!unit) return helper.compose(h, ERROR, `Parameter tidak lengkap (unit)`)
                var quality = request.payload.quality
                if(!quality) return helper.compose(h, ERROR, `Parameter tidak lengkap (quality)`)
                var filename = request.payload.filename
                if(!filename) return helper.compose(h, ERROR, `Parameter tidak lengkap (filename)`)

                var qry
                qry = await Connection.raw2(`
                    INSERT INTO product (FRUIT_ID, USER_ID, PRODUCT_NAME, PRODUCT_DESCRIPTION, PRODUCT_PRICE, PRODUCT_UNIT, PRODUCT_QUALITY, PRODUCT_FILE_PATH) VALUES(?,?,?,?,?,?,?,?)
                `, [fruit_id, user_id, name, description, price, unit, quality, filename])

                var data = {
                    
                }
                return helper.compose(h, SUCCESS, `Berhasil menambahkan produk`, data)
            }
        },

        {
            path: '/product/manage/update',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var product_id = request.payload.product_id
                if(!product_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (product_id)`)
                var fruit_id = request.payload.fruit_id
                if(!fruit_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (fruit_id)`)
                var user_id = request.payload.user_id
                if(!user_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (user_id)`)
                var name = request.payload.name
                if(!name) return helper.compose(h, ERROR, `Parameter tidak lengkap (name)`)
                var description = request.payload.description
                if(!description) return helper.compose(h, ERROR, `Parameter tidak lengkap (description)`)
                var price = request.payload.price
                if(!price) return helper.compose(h, ERROR, `Parameter tidak lengkap (price)`)
                var unit = request.payload.unit
                if(!unit) return helper.compose(h, ERROR, `Parameter tidak lengkap (unit)`)
                var quality = request.payload.quality
                if(!quality) return helper.compose(h, ERROR, `Parameter tidak lengkap (quality)`)
                var filename = request.payload.filename
                if(!filename) return helper.compose(h, ERROR, `Parameter tidak lengkap (filename)`)


                var qry
                qry = await Connection.raw2(`
                SELECT * FROM product as A JOIN fruit as B ON A.FRUIT_ID = B.FRUIT_ID JOIN user as C ON A.USER_ID = C.USER_ID WHERE A.PRODUCT_ID = ? AND A.USER_ID = ?
                `, [product_id, user_id])

                if(qry[0].length == 0){
                    return helper.compose(h, ERROR, `Ops.. produk tidak ditemukan`)
                }
                
                qry = await Connection.raw2(`
                    UPDATE product SET PRODUCT_NAME = ?, PRODUCT_DESCRIPTION = ?, PRODUCT_PRICE = ?, PRODUCT_UNIT = ?, PRODUCT_QUALITY = ?, PRODUCT_FILE_PATH = ? WHERE PRODUCT_ID = ?
                `, [name, description, price, unit, quality, filename, product_id])

                var data = {
                    
                }
                return helper.compose(h, SUCCESS, `Berhasil memperbarui produk`, data)
            }
        },

        {
            path: '/product/manage/delete',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var product_id = request.payload.product_id
                if(!product_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (product_id)`)
                var user_id = request.payload.user_id
                if(!user_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (user_id)`)

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM product WHERE PRODUCT_ID = ? AND USER_ID = ?
                `, [product_id, user_id])

                if(qry[0].length == 0){
                    return helper.compose(h, ERROR, `Ops.. produk tidak ditemukan`)
                }
                
                qry = await Connection.raw2(`
                    DELETE FROM product WHERE PRODUCT_ID = ?
                `, [product_id])

                var data = {
                    
                }
                return helper.compose(h, SUCCESS, `Berhasil menghapus produk`, data)
            }
        },

        {
            path: '/cart/list',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var user_id = request.payload.user_id
                if(!user_id) return helper.compose(h, ERROR, "Parameter tidak lengkap (user_id")

                var qry

                qry = await Connection.raw2(`
                    SELECT * FROM user WHERE USER_ROLE = 'SELLER' AND USER_ID != ?
                `, [user_id])
                var cartSeller = qry[0]

                var total_price = 0
                //cartSeller.forEach(async function(value, index){
                for(var i = 0; i < cartSeller.length; i++){
                    qry = await Connection.raw2(`
                        SELECT A.CART_ID, A.PRODUCT_ID, SUM(A.CART_QTY) AS TOTAL_QTY,
                        (SELECT MAX(CART_ADD_DATETIME) FROM cart AS AA WHERE AA.USER_ID = A.USER_ID AND AA.PRODUCT_ID = A.PRODUCT_ID) AS LATEST, B.*, C.*
                        FROM cart AS A
                        JOIN user AS B ON A.USER_ID = B.USER_ID
                        JOIN product AS C ON A.PRODUCT_ID = C.PRODUCT_ID
                        JOIN fruit AS D ON C.FRUIT_ID = D.FRUIT_ID
                        WHERE A.USER_ID = ?
                        AND C.USER_ID = ?
                        GROUP BY A.PRODUCT_ID
                        ORDER BY LATEST DESC
                    `, [user_id, cartSeller[i].USER_ID])
                    var cart = qry[0]

                    //var invalidIndexArr = []
                    for(var i2 = 0; i2 < cart.length; i2++ ){
                        if(parseInt(cart[i2].TOTAL_QTY) == 0){
                            //invalidIndexArr.push(i2)
                            cart.splice(i2, 1)
                        }
                    }

                    cartSeller[i].ITEM = cart
                    
                    qry = await Connection.raw2(`
                        SELECT SUM(A.CART_QTY * B.PRODUCT_PRICE) as TOTAL FROM cart as A JOIN product as B ON A.PRODUCT_ID = B.PRODUCT_ID JOIN user as C ON A.USER_ID = C.USER_ID
                        WHERE A.USER_ID = ? AND B.USER_ID = ?
                    `, [user_id, cartSeller[i].USER_ID])
                    var total = qry[0]
                    cartSeller[i].TOTAL = total[0].TOTAL == null ? 0 : parseInt(total[0].TOTAL)

                    total_price += cartSeller[i].TOTAL
                }
                //})

                var data = {
                    cart : cartSeller,
                    total_price : total_price
                }
                return helper.compose(h, SUCCESS, `List produk`, data)
            }
        },

        {
            path: '/cart/add',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                if(request.payload == null) request.payload = {}
                var user_id = request.payload.user_id
                if(!user_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (user_id)`)
                var product_id = request.payload.product_id
                if(!product_id) return helper.compose(h, ERROR, `Parameter tidak lengkap (product_id)`)
                var qty = request.payload.qty
                if(!qty) return helper.compose(h, ERROR, `Parameter tidak lengkap (qty)`)

                var qry
                qry = await Connection.raw2(`
                    INSERT INTO cart (PRODUCT_ID, USER_ID, CART_QTY, CART_ADD_DATETIME) VALUES(?,?,?,?)
                `, [product_id, user_id, qty, helper.currentDatetime("")])

                var data = {
                    
                }
                return helper.compose(h, SUCCESS, `Berhasil menambahkan ke keranjang`, data)
            }
        },

        {
            method: 'GET',
            path: '/uploads',
            handler: (request, h) => {
                var path = request.query.path
                path = path.replace("[slice]", "/")
                return h.file('./' + path);
            }    
        },
        

    ]);


    await server.start()
    console.log(`server started on : ${server.info.uri}`)

}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()