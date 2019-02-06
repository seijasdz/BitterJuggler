'use strict';
const { Group } =  require('../models');

module.exports.create = async (req, res) => {
  try {
    const group = await Group.create(req.body);
    return res.status(201).json(group);
  } catch (e) {
    console.error(e);
    return res.status(422).json({ message: 'unprocessable' });
  }
};