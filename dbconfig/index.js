const Sequelize = require('sequelize')
const env = require('.././env')

const sequelize = new Sequelize(env.DB_DBNAME, env.DB_USERNAME, env.DB_PASSWORD, {
    host: env.DB_HOST,
    port: env.DB_PORT,
    dialect: "mysql"
});

module.exports.connect = sequelize

module.exports.raw = async function(query){
    try{
        await sequelize.authenticate()
        const [result, metadata] = await sequelize.query(query)
        return [result, metadata]

    } catch(error){
        console.log(`raw query failed ${error}`)
    }
}

// query raw/plain (versi 2)
module.exports.raw2 = async function(query, params){
    try{
        await sequelize.authenticate()
        var finalQuery = query
        for(var i = 0; i < params.length; i++){
            finalQuery = finalQuery.replace("?", "'" + params[i] + "'")
        }
        const [result, metadata] = await sequelize.query(finalQuery)
        return [result, metadata]

    } catch(error){
        console.log(`raw query 2 failed ${error}`)
    }
}

async function testConnection(){
    try{
        await sequelize.authenticate()
        console.log("connected")

        const [result, metadata] = await sequelize.query("SELECT * FROM user")
        console.log(result)

    } catch(error){
        console.log(`test connection failed ${error}`)
    }
}

// testConnection()
