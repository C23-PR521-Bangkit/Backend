
module.exports.compose = function(handler, status, message, payload){
    return handler.response({
        SENDER: "FRUTIFY BACKEND APP",
        MESSAGE: message,
        PAYLOAD: payload
    })
}