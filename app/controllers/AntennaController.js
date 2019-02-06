'use strict';
const Antenna = require('../models').Antenna;
const to = require('../util').to;
const successResponse = require('../util').successResponse;
const errorResponse = require('../util').errorResponse;
const notifyEvent = require('../broker').notifyEvent;
const sendToApidevices = require('../services/HttpSender').sendToApidevices;
const TagUpdater = require('../services/TagUpdater');
const httpSender = require('../services/HttpSender');
const receive = require('../services/newHttpSender').receive;
const getRecentTags = require('../services/newHttpSender').getRecentTags;
const getTags = require('../services/newHttpSender').getTags;

const on = require('../broker').on;

on('antenna.tag.read', TagUpdater.update);
on('antenna.tag.read', receive);

module.exports.getRecent = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let identifier = req.params.identifier;
  let tags = await getRecentTags(identifier);
  if (tags && tags.length) {
    return successResponse(res, {tags}, 200);
  } else {
    return successResponse(res, {tags:[]}, 200);
  }
  
}

module.exports.getTags = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let identifier = req.params.identifier;
  let tags = await getTags(identifier);
  if (tags && tags.length) {
    return successResponse(res, {tags}, 200);
  } else {
    return successResponse(res, {tags:[]}, 200);
  }
}

module.exports.create = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let err, antenna;

  if (!req.body.workmode || !req.body.workmode.length) {
    req.body.workmode = [0, 2, 4, 0, 1, 0];
  }

  [err, antenna] = await to(Antenna.create(req.body));
  if (err) {
      return errorResponse(res, err, 422);
  }
  notifyEvent('antenna_event', 'topic', 'antenna.created', 'pacman', false);
  return successResponse(res, antenna, 201);
};

module.exports.getAll = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let err, antennas;
  [err, antennas] = await to(Antenna.find({}).exec());
  if (err) {
    return errorResponse(res, err, 422);
  }
  return successResponse(res, antennas, 200);
};

const getOne = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let identifier = req.params.identifier;
  let err, antenna;
  [err, antenna] = await to(Antenna.findOne({identifier}).exec());
  if (err) {
    errorResponse(res, err, 422);
  }
  if (!antenna) {
    errorResponse(res, {message: 'not found'}, 404);
  }
  if (antenna) {
    return antenna;
  }
  return false;
};

module.exports.get = async (req, res) => {
  let antenna = await getOne(req, res);
  if (antenna) {
    return successResponse(res, antenna, 200);
  }
};

module.exports.update = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const identifier = req.params.identifier;
  const config = req.body;
  let antenna;
  try {
    antenna = await Antenna.findOne({identifier});
  } catch (e) {
    return res.status(400).json(e.message);
  }
  if (!antenna) {
    return res.status(404).json('antenna not found');
  }
  try {
    antenna.set(config);
    antenna = await antenna.save();
  } catch (e) {
    return res.status(422).json(e.message);
  }
  notifyEvent('antenna_event', 'topic', 'antenna.updated', identifier, false);
  return res.status(200).json(antenna);
};

const recentTags = (identifier, rrtags) => {
  const now = Math.floor((new Date).getTime()/1000);
  let list = [];
  for(const tag in rrtags){
    TagUpdater.cleanOldTags(identifier, now);
    if (rrtags.hasOwnProperty(tag)){
      list.push(tag);
    }
  }
  return list;
};

module.exports.read = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let antenna = await getOne(req, res);
  if (antenna) {
    let rrtags = TagUpdater.recentReaderTags[req.params.identifier];
    if (rrtags) {
      let tags = recentTags(req.params.identifier, rrtags);
      return successResponse(res, {tags}, 200);
    } else {
      return successResponse(res, {tags:[]}, 200);
    }
  }
};

module.exports.simpleread = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let antenna = await getOne(req, res);
  if (antenna) {
    let rrtags = TagUpdater.recentReaderTags[req.params.identifier];
    if (rrtags){
      let list = recentTags(req.params.identifier, rrtags);
      return successResponse(res, list, 200);
    } else {
      return successResponse(res, [], 200);
    }
  }
}