'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const AntennaSchema = new mongoose.Schema({
  isActivator: {
    type: Boolean,
    required: true,
    default: false,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  descr: {
    type: String,
    required: true
  },
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  addr: {
    type: Number,
    required: true,
    default: 0
  },
  ip: {
    type: String,
    required: true
  },
  port: {type: Number,
    required: true
  },
  timeout: {
    type: Number,
    required: true,
    default: 3
  },
  power: {
    type: Number,
    required: true,
    default: 25
  },
  scantime: {
    type: Number,
    required: true,
    default: 255
  },
  tries:{
    type: Number,
    required: true,
    default: 10
  },
  workmode: [
    {
      type: Number,
      required: true
    }
  ],
  enabled: {
    type: Number,
    required: true,
    default: true,
  },
  group: {
    type: String,
    required: true
  },
  antennaGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
  }
}, {timestamps: true, toJSON: {virtuals: true}, toObject: {virtuals: true}});

AntennaSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Antenna', AntennaSchema);