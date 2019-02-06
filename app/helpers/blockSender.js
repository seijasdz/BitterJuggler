'use strict'
const TagProcessor = require('./TagProcessor');

const tagProcessor = new TagProcessor();
  
module.exports.receive = (message) => {
  try {
    const content = JSON.parse(message.content.toString());
    tagProcessor.receive(content);
  } catch (e) {
    console.error(e);
  }
};
  
module.exports.endReceive = (body) => {
  try {
    tagProcessor.receive(body);
  } catch (e) {
    console.error(e);
  }
};