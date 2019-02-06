'use strict';
const pe = require('parse-error');

const to = function(promise) {//global function that will help use handle promise rejections, this article talks about it http://blog.grossman.io/how-to-write-async-await-without-try-catch-blocks-in-javascript/
    return promise
    .then(data => {
        return [null, data];
    }).catch(err =>
        [pe(err)]
    );
}

module.exports.to = to;

const throwError = function(err_message, log){ //for Throw Error
    if(log === true){
        console.error(err_message);
    }

    throw new Error(err_message);
}

module.exports.throwError = throwError;

const errorResponse = function(res, err, code){ // Error Web Response
    if(typeof err == 'object' && typeof err.message != 'undefined'){
        err = err.message;
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json({success:false, error: err});
}

module.exports.errorResponse = errorResponse;

const successResponse = function(res, data, code){ // Success Web Response
    let send_data = {success:true};

    if(typeof data == 'object'){
        send_data = Object.assign(data, send_data);//merge the objects
    }

    if(typeof code !== 'undefined') res.statusCode = code;

    return res.json(send_data)
};

module.exports.successResponse = successResponse;

module.exports.reflect = p => p.then(values => ({values, fulfilled: true }),
error => ({error, fulfilled: false }));