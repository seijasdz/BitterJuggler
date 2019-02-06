'use strict';

let recentReaderTags = {}
const difference = 3;

const cleanOldTags = (name, now) => {
  for (const tag in recentReaderTags[name]) {
    if (recentReaderTags[name].hasOwnProperty(tag)) {
      if (now - recentReaderTags[name][tag] > difference) {
        delete recentReaderTags[name][tag];
      } 
    }
  }
};

module.exports.recentReaderTags = recentReaderTags;
module.exports.cleanOldTags = cleanOldTags;

const update = (message) => {
  const now = Math.floor((new Date).getTime()/1000);
  let lastRead = JSON.parse(message.content.toString());
      
  let lastReader;
  
  if (recentReaderTags.hasOwnProperty(lastRead.name)) {
    // Clean old tags
    cleanOldTags(lastRead.name, now);
    lastReader = recentReaderTags[lastRead.name];
  } else {
    lastReader = recentReaderTags[lastRead.name] = {};
  }
  
  for (const tag of lastRead.tags) {
    if (!lastReader.hasOwnProperty(tag)) {
      lastReader[tag] = now;
    }
  }
  
  //console.log(recentReaderTags);
};

module.exports.update = update;