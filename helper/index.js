module.exports.compose = function(handler, status, message, payload = null){
    return handler.response({
        SENDER: "FRUTIFY BACKEND APP",
        STATUS: status,
        MESSAGE: message,
        PAYLOAD: payload
    })
}

module.exports.currentDatetime = function(format){
    const dateObj = new Date();

    let year = dateObj.getFullYear();

    let month = dateObj.getMonth();
    month = ('0' + (month + 1)).slice(-2);

    let date = dateObj.getDate();
    date = ('0' + date).slice(-2);

    let hour = dateObj.getHours();
    hour = ('0' + hour).slice(-2);

    let minute = dateObj.getMinutes();
    minute = ('0' + minute).slice(-2);

    let second = dateObj.getSeconds();
    second = ('0' + second).slice(-2);

    const time = `${year}-${month}-${date} ${hour}:${minute}:${second}`;
    return time
}