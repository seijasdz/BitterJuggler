const axios = require('axios');
const fs = require('fs');
const WAIT = CONFIG.wait;
const OLD_TAG_DIFFERENCE = CONFIG.old_tag_difference;
const MILLISECONDS_TILL_REQUEST = CONFIG.milliseconds_till_request;

const toLog = (line) => {
  line = line + '\n';
  if (CONFIG.use_log) {
    console.log(line);
    fs.appendFile(CONFIG.log_file, line, (err) => {
      if (err) {
        console.log(err, 'error agregando al archivo de log');
      }
    });
  }
};

class Tag {
  constructor(code){
    this.code = code;
    this.lastEpoch = 0;
    this.sent = false;
    this.readers = [];
  }
  readBy(readerIdentifier) {
    return this.readers.includes(readerIdentifier);
  }
  addReader(readerIdentifier) {
    if (!this.readers.includes(readerIdentifier)) {
      this.readers.push(readerIdentifier);
    }
  }
}

const groups = {};

class Reader {
  constructor(identifier, groupName) {
    this.identifier = identifier;
    
    if (!groups[groupName]) {
      console.log('creando grupo', groupName);
      groups[groupName] = {
        tags: {},
        sendingLot: false,
        isReading: false,
        lastPreKey: 0,
      };
    }
    console.log(this.identifier, 'se unio al grupo', groupName);
    this.group = groups[groupName];
    this.tags = this.group.tags;

    setInterval(() => {
      const now = Math.floor((new Date).getTime()/1000);
      if (!this.group.isReading) {
        this.checkMoreTags();
      }
      if(this.readyToSend(now).length) {
        if (!this.group.sendingLot) {
          this.group.sendingLot = true;
          this.sendLot(now);
        }
      }
    }, 200);
  }
  updateTags(tagCodes, now) {
    for (const code of tagCodes) {
      if (!this.tags[code]) {
        this.tags[code] = new Tag(code);
      }
      const tag = this.tags[code];

      if (tag.sent && now - tag.lastEpoch > CONFIG.tagIgnore || !tag.sent) {
        if (tag.sent) {
          tag.readers = [];
        }
        tag.addReader(this.identifier);
        tag.lastEpoch = now;
        tag.sent = false;
      } else {
        console.log(this.identifier, 'se ignora tag repetido', tag.code);
      }
      
    }
  }
  readyToSend(now) {
    const lot = []
    for (const key of Object.keys(this.tags)) {
      if (now - this.tags[key].lastEpoch > WAIT && !this.tags[key].sent) {
        lot.push(key);
      }
    }
    return lot
  }
  sendLot(now) {
    console.log('sendlot', this.identifier)
    setTimeout(async () => {
      const nownow = Math.floor((new Date).getTime()/1000);
      const toSend = this.readyToSend(nownow);
      if (!toSend.length) {
        this.group.sendingLot = false
        return;
      }
      for (const key of toSend) {
        this.tags[key].sent = true;
      }
      let response;
      try{
        console.log('envio de activacion', this.identifier);
        response = (await axios({
          method: 'post',
          url: CONFIG.operationPostUrl,
          timeout: 10000,
          data: {
            data: {
              id: this.identifier,
              tags: toSend,
              timestamp: Math.floor((new Date).getTime()/1000),
            },
            conf: {
              preKey: this.group.lastPreKey,
              activatorId: this.identifier,
              devicetype: 'rfid',
              id: this.identifier,
            },
          },
        }));
      console.log('se envio lote', this.identifier, this.group.lastPreKey);
      this.group.lastPreKey = 0
      this.group.sendingLot = false;
      this.group.isReading = false;
      } catch (e) {
        console.log('activacion fallida');
        console.log(e);
      }
    }, MILLISECONDS_TILL_REQUEST);
  }
  async checkMoreTags() {
    for (const key of Object.keys(this.tags)) {
      if (!this.tags[key].sent) {
        this.group.isReading = true;
        try{
          console.log('notifying', this.identifier)
          this.group.lastPreKey = (await axios({
            method: 'post',
            url: CONFIG.preOperationPostUrl,
            timeout: 10000,
            data: {
              data: {
                id: this.identifier,
                timestamp: Math.floor((new Date).getTime()/1000),
              },
              conf: {
                activatorId: this.identifier,
                devicetype: 'rfid',
                id: this.identifier,
              },
            },
          })).data.epoch;
          console.log('llego prekey', this.group.lastPreKey);
        } catch (e) {
          console.log('pre aviso fallido', this.identifier);
          console.log(e);
        }
        return true;
      }
    }
  }
  getRecentTags() {
    const now = Math.floor((new Date).getTime()/1000);
    const lot = []
    for (const key of Object.keys(this.tags)) {
      if (now - this.tags[key].lastEpoch > (WAIT)
      && now - this.tags[key].lastEpoch <= OLD_TAG_DIFFERENCE
      && this.tags[key].sent
      && this.tags[key].readBy(this.identifier)) { 
        lot.push(key);
      }
    }
    return lot
  }
  getTags() {
    const now = Math.floor((new Date).getTime()/1000);
    const lot = []
    for (const key of Object.keys(this.tags)) {
      if (now - this.tags[key].lastEpoch < WAIT && !this.tags[key].sent) {
        lot.push(key);
      }
    }
    return lot
  }
}

class TagCatcher {
  constructor() {
    this.readers = {}
  }
  receive(message) {
    const date = new Date();
    const now = Math.floor((date).getTime()/1000);
    const content = JSON.parse(message.content.toString());
    const readerIdentifier = content.name;
    const tags = content.tags;
    
    const line = readerIdentifier + " " + tags.toString() + " " + date.toISOString();
    toLog(line);

    const isActivator = content.isActivator;
    const group = content.group;
    
    if (!this.readers[readerIdentifier]) {
      this.readers[readerIdentifier] = new Reader(readerIdentifier, group);
    }
    const reader = this.readers[readerIdentifier];
    
    reader.updateTags(tags, now);
  }
  endReceive(content) {
    const now = Math.floor((new Date).getTime()/1000);
    
    const readerIdentifier = content.name;
    const tags = content.tags;
    const isActivator = content.isActivator;
  
    if (!this.readers[readerIdentifier]) {
      this.readers[readerIdentifier] = new Reader(readerIdentifier);
    }
    const reader = this.readers[readerIdentifier];
    
    reader.updateTags(tags, now);
  }
  getRecentTags(readerIdentifier) {
    if (!this.readers[readerIdentifier]) {
      return;
    }
    return this.readers[readerIdentifier].getRecentTags();
  }
  getTags(readerIdentifier) {
    if (!this.readers[readerIdentifier]) {
      return;
    }
    return this.readers[readerIdentifier].getTags();  
  }
}

tagCatcher = new TagCatcher();

module.exports.receive = (message) => {
  try {
    tagCatcher.receive(message);
  } catch (e) {
    console.log(e);
  }
};

module.exports.endReceive = (body) => {
  try {
    tagCatcher.endReceive(body);
  } catch (e) {
    console.log(e);
  }
};

module.exports.getRecentTags = (readerIdentifier) => {
  return tagCatcher.getRecentTags(readerIdentifier);
};

module.exports.getTags = (readerIdentifier) => {
  return tagCatcher.getTags(readerIdentifier);
}