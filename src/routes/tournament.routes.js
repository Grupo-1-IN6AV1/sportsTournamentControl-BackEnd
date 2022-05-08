'use strict'

const tournamentController = require('../controllers/tournament.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

api.get('/tournamentTest', tournamentController.tournamentTest);
api.post('/createTournament', mdAuth.ensureAuth, tournamentController.createTournament);
api.get('/getTournaments', mdAuth.ensureAuth, tournamentController.getTournaments);
api.get('/getTournament/:id', mdAuth.ensureAuth, tournamentController.getTournament);
api.put('/updateTournament/:id', mdAuth.ensureAuth, tournamentController.updateTournament);
api.put('/updateTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.updateTournamentByAdmin);
api.delete('/deleteTournament/:id', mdAuth.ensureAuth, tournamentController.deleteTournament);
api.delete('/deleteTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.deleteTournamentByAdmin);
api.post('/addTeamTournament/:id', mdAuth.ensureAuth, tournamentController.addTeamTournament);
api.post('/addJourneyTournament/:id', mdAuth.ensureAuth, tournamentController.addJourneyTournament);
api.post('/deleteTeamTournament/:id', mdAuth.ensureAuth, tournamentController.deleteTeamTournament);
api.get('/getTournamentsByAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentsByAdmin)

module.exports = api;