'use strict'

const journeyController = require('../controllers/journey.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

//RUTAS DEL USUARIO//
api.get('/journeyTest', journeyController.testJourney);
api.post('/addMatch/:id', mdAuth.ensureAuth, journeyController.addMatch);
api.delete('/deleteMatch/:id', mdAuth.ensureAuth, journeyController.deleteMatch);
api.get('/getMatches', mdAuth.ensureAuth, journeyController.getMatches);
api.get('/getMatch/:id', mdAuth.ensureAuth, journeyController.getMatch);

//RUTAS DEL ADMINISTRADOR//
api.get('/getJourneyAdmin/:id', [mdAuth.ensureAuth,mdAuth.isAdmin], journeyController.getJourneyAdmin);
api.get('/getJourneysAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], journeyController.getJourneysAdmin);
api.get('/getMatchesAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], journeyController.getMatchesAdmin);
api.delete('/deleteMatchAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], journeyController.deleteMatchAdmin);

module.exports = api;