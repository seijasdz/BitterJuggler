'use strict';
const amqp = require('amqplib');

let events = {};

let channelPromise = amqp.connect(CONFIG.amqpCompleteURI).then(async (conn) => {
    let ch = await conn.createChannel();
    let ok = await ch.assertExchange('antenna_event', 'topic', {durable: false});
    return ch;
}).catch((err) => {
    console.log('no rabbit');
    process.exit(1);
});


module.exports.on = (key, callback) => {
    if (!events[key]) {
        channelPromise.then(async (ch) => {
            let q = await ch.assertQueue('', {exclusive: true});
            ch.bindQueue(q.queue, 'antenna_event', key);
            ch.consume(q.queue, (msg) => {
                execCallbacks(key, msg);
            }, {noAck: false});
        });
    }
    events[key] = events[key] ? events[key].concat([callback]): [callback];
};

const execCallbacks = (key, msg) => {
    let callbacks = events[key];
    callbacks.forEach(cb => {
        cb(msg);
    });
};

module.exports.notifyEvent = async (exchange, type, key, message, durable) => {
  channelPromise.then(async (ch) => {
    try {
        let ok = await ch.assertExchange(exchange, type, {durable});
        ch.publish(exchange, key, new Buffer.from(message));
      } catch (error) {
        console.log(error);
      }      
  });
}