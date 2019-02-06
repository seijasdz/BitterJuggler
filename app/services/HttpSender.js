'use strict';
const axios = require('axios');

const tagIgnore = CONFIG.tagIgnore;
const sendTimeout = CONFIG.sendTimeout;
const readers = {};

const cleanOldTags = () => {
  const now = Math.floor((new Date).getTime()/1000);
  for (const reader in readers) {
    if (readers.hasOwnProperty(reader)) {
      const toDelete = [];
      const blockList = readers[reader].blockList;
      for (const tag in blockList) {
        if (blockList.hasOwnProperty(tag)) {
          if (blockList[tag] && now - blockList[tag] >= tagIgnore) {
            toDelete.push(tag);
          }
        }
      }
      for (const tag of toDelete) {
        delete blockList[tag];
      }
    }
  }
};

const postsend = (reader) => {
  reader.toSend = [];
  reader.sending = false;
};

const send = (reader) => {
  setTimeout(async () => {
    try { 
      const response = await axios({
        method: 'post',
        url: CONFIG.operationPostUrl,
        data: {
          data: {
            tags: reader.toSend,
            id: reader.id,
            timestamp: Math.floor((new Date).getTime()/1000),
          },
          conf: {
            activatorId: reader.id,
            devicetype: 'rfid',
            id: reader.id,
          },
        },
      });
      postsend(reader);
    } catch (e) {
      if (e.response) {
        console.log('entregado a apidevices con error', e.response.status);
      } else {
        console.log('sin respuesta de apidevices');
      }
      postsend(reader);
    }
  }, sendTimeout);
};


module.exports.toApiDevices = (message) => {
  const now = Math.floor((new Date).getTime()/1000);  
  const lastRead = JSON.parse(message.content.toString());
  const readerIdentifier = lastRead.name;
  const tags = lastRead.tags;
  const isActivator = lastRead.isActivator;
  
  if (!isActivator) {
    return;
  }

  let reader;

  if (!readers[readerIdentifier]) {
    reader = readers[readerIdentifier] = {
      sending: false,  
      blockList: {},
      toSend: [],
      id: readerIdentifier, 
    };
  } else {
    reader = readers[readerIdentifier];
  }

  cleanOldTags();

  for (const tag of tags) {
      if (!reader.blockList[tag]) {
          reader.blockList[tag] = now;
          reader.toSend.push(tag);
          if (!reader.sending) {
              reader.sending = true;
              send(reader);
          }
      }
  }
}
