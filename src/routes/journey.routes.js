'use strict'

const journeyController = require('../controllers/journey.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();


api.get('/getJourneys/:id', mdAuth.ensureAuth, journeyController.getJourneys);
api.post('/addMatch/:id', mdAuth.ensureAuth, journeyController.addMatch);
api.get('/getJourney/:id', mdAuth.ensureAuth, journeyController.getJourney)
api.post('/deleteJorney/:id', mdAuth.ensureAuth, journeyController.deleteJourney);
api.get('/getMatches/:id', mdAuth.ensureAuth, journeyController.getMatches);
api.post('/deleteMatch/:id', mdAuth.ensureAuth, journeyController.deleteMatch);
api.get('/getMatchesAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], journeyController.getMatchesAdmin)
api.get('/getTeamsTournament/:id', mdAuth.ensureAuth, journeyController.getTeamTournament);
api.post('/getMatch/:id', mdAuth.ensureAuth, journeyController.getMatch);
api.post('/updateMatch/:id', mdAuth.ensureAuth, journeyController.updateMatchJourney);

module.exports = api;