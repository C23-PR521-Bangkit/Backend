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


const init = async () => {

    const server = Hapi.Server({
        host: env.SERVER_HOST,
        port: env.SERVER_PORT,
        routes : {
            files : {
                relativeTo: path.join(__dirname, 'static')
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
            path: '/',
            method: 'GET',
            handler: async (request, h) => {
                return helper.compose(h, SUCCESS, `Tested`, env.SERVER_HOST)
            }
        },

        {
            path: '/auth/login',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                var email = request.payload.email
                var password = request.payload.password

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
            path: '/auth/register',
            method: 'POST',
            options: {
                payload: {
                    multipart: true
                }
            },
            handler: async (request, h) => {
                var email = request.payload.email
                var password = request.payload.password
                var phone = request.payload.phone

                var qry
                qry = await Connection.raw2(`
                    SELECT * FROM user WHERE USER_EMAIL = ?
                `, [email])
                var user = qry[0]

                if(user.length > 0){
                    return helper.compose(h, ERROR, `Maaf, email ${email} sudah digunakan`)
                }

                qry = await Connection.raw2(`
                    INSERT INTO user (USER_EMAIL, USER_PHONE, USER_PASSWORD) VALUES (?, ?, ?)
                `, [email, phone, password])

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
                var image = request.payload.image
                console.log(image)

                var fileData = image.hapi
                console.log(fileData)
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
                console.log(file)

                var fileSizeInBytes = file.size;
                var fileSizeInMegabytes = fileSizeInBytes / (1024*1024);
                console.log(fileSizeInMegabytes)

                if(fileSizeInMegabytes > 10){
                    return helper.compose(h, ERROR, `Ukuran file maksimal 10 MB`)
                }

                // do machine learning prediction

                return helper.compose(h, SUCCESS, `Berhasil upload`)
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
                    stringQry += `WHERE A.PRODUCT_NAME LIKE ? OR A.PRODUCT_DESCRIPTION LIKE ? `
                    var aParam = "%" + search + "%"
                    params.push(aParam)
                    params.push(aParam)
                }

                var qry
                qry = await Connection.raw2(stringQry, params)

                var data = {
                    product : qry[0]
                }
                return helper.compose(h, SUCCESS, `List buah`, data)
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