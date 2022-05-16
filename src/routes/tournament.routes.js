'use strict'

const tournamentController = require('../controllers/tournament.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

api.get('/tournamentTest', tournamentController.tournamentTest);

//CLIENT//

//---- T O U R N A M E N T ----// 
api.post('/createTournament', mdAuth.ensureAuth, tournamentController.createTournament);
api.get('/getTournamentsUser', mdAuth.ensureAuth, tournamentController.getTournaments);
api.get('/getTournament/:id', mdAuth.ensureAuth, tournamentController.getTournament);
api.put('/updateTournament/:id', mdAuth.ensureAuth, tournamentController.updateTournament);
api.delete('/deleteTournament/:id', mdAuth.ensureAuth, tournamentController.deleteTournament);
api.get('/tableTournament/:id', mdAuth.ensureAuth, tournamentController.tableTournaments);
//---- M A T C H ----// 
api.post('/addTeamTournament/:id', mdAuth.ensureAuth, tournamentController.addTeamTournament);

api.post('/createTournamentByAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.createTournamentByAdmin);
api.put('/updateTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.updateTournamentByAdmin);
api.delete('/deleteTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.deleteTournamentByAdmin);
api.get('/getTournamentsByAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentsByAdmin)
api.get('/getTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentByAdmin)
//---- M A T C H ----// 
api.post('/addTeamTournamentByAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.addTeamTournamentByAdmin);
api.get('/getTournamentsByAdminForUser/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], tournamentController.getTournamentsByAdminForUser)

module.exports = api;