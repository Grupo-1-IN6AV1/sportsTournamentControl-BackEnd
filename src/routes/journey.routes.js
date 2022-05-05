'use strict'

const journeyController = require('../controllers/journey.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();


api.get('/journeyTest', journeyController.testJourney);


module.exports = api;