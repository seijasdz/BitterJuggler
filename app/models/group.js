'use strict';

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  identifier: {
    type: String,
    required: true,
    unique: true,
  },
  descr: {
    type: String,
    required: true,
  },
  lotLife: {
    type: Number,
    required: true,
  },
  wait: {
    type: Number,
    required: true,
  }
});

GroupSchema.plugin(uniqueValidator);

module.exports = mongoose.model('Group', GroupSchema);