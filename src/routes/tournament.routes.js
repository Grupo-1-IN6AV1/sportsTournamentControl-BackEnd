'use strict'

const tournamentController = require('../controllers/tournament.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

api.get('/tournamentTest', tournamentController.tournamentTest);

//CLIENT//
api.post('/createTournament', mdAuth.ensureAuth, tournamentController.createTournament);
api.get('/getTournaments', mdAuth.ensureAuth, tournamentController.getTournaments);
api.get('/getTournament/:id', mdAuth.ensureAuth, tournamentController.getTournament);
api.put('/updateTournament/:id', mdAuth.ensureAuth, tournamentController.updateTournament);
api.delete('/deleteTournament/:id', mdAuth.ensureAuth, tournamentController.deleteTournament);

//ADMIN//
api.put('/updateTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.updateTournamentByAdmin);
api.delete('/deleteTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.deleteTournamentByAdmin);
api.get('/getTournamentsByAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentsByAdmin)
api.get('/getTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentByAdmin)

module.exports = api;