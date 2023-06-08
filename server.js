'use strict'

const Hapi = require('@hapi/hapi')
const Inert = require("@hapi/inert")
const path = require('path')
const Connection = require('./dbconfig')
const helper = require('./helper')
const SUCCESS = "SUCCESS";
const ERROR = "ERROR";


const init = async () => {

    const server = Hapi.Server({
        host: 'localhost',
        port: 888,
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

    ]);

    await server.start()
    console.log(`server started on : ${server.info.uri}`)

}

process.on('unhandledRejection', (err) => {
    console.log(err)
    process.exit(1)
})

init()