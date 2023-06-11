module.exports.compose = function(handler, status, message, payload = null){
    return handler.response({
        SENDER: "FRUTIFY BACKEND APP",
        STATUS: status,
        MESSAGE: message,
        PAYLOAD: payload
    })
}

