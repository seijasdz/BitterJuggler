'use strict';
const express 			= require('express');
const router 			= express.Router();
const passport      	= require('passport');
const path             = require('path');
const endReceive = require('../helpers/blockSender').endReceive;
const GroupController = require('../controllers/GroupController');
const AntennaController = require('../controllers/AntennaController');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({status:"success", message:"Parcel Pending API", data:{"version_number":"v1.0.0"}})
});

router.post('/antennas', AntennaController.create);
router.get('/antennas', AntennaController.getAll);
router.get('/antennas/:identifier', AntennaController.get);
router.put('/antennas/:identifier', AntennaController.update);

router.get('/antennas/:identifier/recentread', AntennaController.getRecent);
router.get('/antennas/:identifier/newread', AntennaController.getTags);
router.get('/antennas/:identifier/simpleread', AntennaController.simpleread);
router.get('/antennas/:identifier/read', AntennaController.read);

router.post('/groups', GroupController.create);

router.post('/newt', (req, res) => {
  endReceive(req.body);
  res.status(200).json({test:'sss'});
});
router.post('/tests', (req, res) => {
  console.log(req.body);
  res.status(300).json(req.body);
});
//********* API DOCUMENTATION **********
router.use('/docs/api.json',            express.static(path.join(__dirname, '/../public/v1/documentation/api.json')));
router.use('/docs',                     express.static(path.join(__dirname, '/../public/v1/documentation/dist')));
module.exports = router;
