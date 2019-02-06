'use strict';
const { toLog } = require('./toLog');
const { Antenna } = require('../models');
const axios = require('axios');

class Tag {
  constructor(code) {
    this.code = code;
    this.antennas = [];
    this.lastEpoch = 0;
    this.sent = false;
  }
  readBy(identifier) {
    return this.antennas.includes(identifier)
  }
  addAntenna(identifier) {
    this.antennas.push(identifier);
  }
}

class Lot {
  constructor(wait, timestamp, identifier) {
    this.wait = wait;
    this.tags = [];
    this.sent = false;
    this.sending = false;
    this.data = {
      data: {
        timestamp,
        id: identifier
      },
      conf : {
        preKey: 0,
        activatorId: identifier,
        id: identifier,
        deviceType: 'rfid',
      }
    }
    this.preactPromise = this.preactivate();
  }
  async preactivate() {
    try {
      this.data.conf.preKey = await axios ({
        url: CONFIG.preOperationPostUrl,
        timeout: 10000,
        data: this.data,
      })
    } catch (e) {
      console.error(e);
      console.log(this.preKey);
    }
  }
  includes(tag) {
    for (const localTag of this.tags) {
      if (localTag.code === tag.code) {
        return true;
      }
    }
    return false;
  }
  addTag(tag) {
    if (!this.includes(tag)) {
      this.tags.push(tag);
    }
  }
  readyToSend(now) {
    for (const tag of this.tags) {
      console.log(now - tag.lastEpoch, tag.code)
      if (now - tag.lastEpoch < this.wait) {
        return false;
      }
    }
    console.log('true');
    return true;
  }
  async send() {
    this.sending = true;
    try {
      await axios({
        url: CONFIG.operationPostUrl,
        timeout: 10000,
        data: this.data,
      })
    this.sent = true;
    } catch (e) {
      console.error(e);
      console.log('fallo envio de lote');
      this.sending = false;
    }
  }
}
class GroupManager {
  constructor(data, antennaId) {
    this.identifier = data.identifier;
    this.antennaId = antennaId;
    this.lastLotEpoch = 0;
    this.tags = {};
    this.lots = {};
    this.lotLife = 10; // Debe venir de la configuracion del grupo
    this.wait = 20; // Debe venir de la configuracion del grupo
    this.startCheckLots();
  }
  startCheckLots() {
    const checkLots = async () => {
      const now = Math.floor((new Date).getTime()/1000);
      for (const key of Object.keys(this.lots)) {
        const lot = this.lots[key];
        if (lot.readyToSend(now) && !lot.sending) {
          lot.send();
        }
      }
    };
    setInterval(checkLots, 500);
  }
  updateTags(tagNames, identifier){
    const now = Math.floor((new Date).getTime()/1000);
    for (const tagName of tagNames) {
      if (!this.tags[tagName]) {
        this.tags[tagName] = new Tag(tagName);
      }
      const tag = this.tags[tagName];
      if (!tag.sent) {
        tag.lastEpoch = now;
        if (!this.inLots(tag)) {
          this.toLot(tag, now);
        }
      } else {
        console.log('ignorando tag ya enviada');
      }
    }
    
  }
  inLots(tag) {
    for (const lotKey of Object.keys(this.lots)) {
      const lot = this.lots[lotKey];
      if (lot.includes(tag)) {
        return true;
      }
    }
    return false;
  }
  toLot(tag, now) {
    if (now - this.lastLotEpoch > this.lotLife) {
      this.lastLotEpoch = now;
      this.lots[this.lastLotEpoch] = new Lot(this.wait, now, this.antennaId);
    }
    this.lots[this.lastLotEpoch].addTag(tag);
  }
}

class AntennaHandle {
  constructor(data) {
    this.data = data;
    this.group = undefined;
  }
  updateTags(tags) {
    this.group.updateTags(tags, this.data.identifier);
  }
}

const antennaBuilder = async (antennaIdentifier) => {
  const data = await Antenna.findOne({
    identifier: antennaIdentifier
  }).populate('antennaGroup').exec();
  return new AntennaHandle(data);
}

class TagProcessor {
  constructor() {
    this.antennas = {};
    this.groups = {};
  }
  async receive(content) {
    const date = new Date();
    const antennaIdentifier = content.name;
    const tags = content.tags;
    const line = antennaIdentifier + " " + tags.toString() + " " + date.toISOString();
    toLog(line);
    
    if (!this.antennas[antennaIdentifier]) {
      this.antennas[antennaIdentifier] = await antennaBuilder(antennaIdentifier);
    }
    const antenna = this.antennas[antennaIdentifier];
    const groupId = antenna.data.antennaGroup.identifier;
    if (!this.groups[groupId]) {
      this.groups[groupId] = new GroupManager(antenna.data.antennaGroup, antennaIdentifier);
    }
    if (!antenna.group) {
      antenna.group = this.groups[groupId];
    }
    antenna.updateTags(tags);
  }
  getRecentTags(antennaIdentifier) {
    if (!this.antennas[antennaIdentifier]) {
      return;
    }
    return this.antennas[antennaIdentifier].getRecentTags();
  }
  getTags(antennaIdentifier) {
    if (!this.antennas[antennaIdentifier]) {
      return;
    }
    return this.antennas[antennaIdentifier].getTags();  
  }
}

module.exports = TagProcessor;