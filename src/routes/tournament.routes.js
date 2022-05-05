'use strict'

const tournamentController = require('../controllers/torneo.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

api.get('/tournamentTest', tournamentController.tournamentTest);
api.post('/createTournament', mdAuth.ensureAuth, tournamentController.createTournament);
api.get('/getTournaments', mdAuth.ensureAuth, tournamentController.viewTournaments);
api.get('/getTournament/:id', mdAuth.ensureAuth, tournamentController.viewTournament);

module.exports = api;