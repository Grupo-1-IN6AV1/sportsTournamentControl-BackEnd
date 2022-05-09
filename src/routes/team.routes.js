'use strict'

const teamController = require('../controllers/team.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

//RUTAS DEL USUARIO//
api.post('/createTeam', mdAuth.ensureAuth, teamController.createTeam);
api.get('/getTeamUser/:id', mdAuth.ensureAuth, teamController.getTeamUser);
api.get('/getTeamsUser', mdAuth.ensureAuth, teamController.getTeamsUser);
api.delete('/deleteTeam/:id', mdAuth.ensureAuth, teamController.deleteTeam);
api.put('/updateTeam/:id', mdAuth.ensureAuth, teamController.updateTeam);

//RUTAS DEL ADMINISTRADOR//
api.get('/getTeamAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], teamController.getTeamAdmin);
api.get('/getTeamsAdmin', [mdAuth.ensureAuth, mdAuth.isAdmin], teamController.getTeamsAdmin);
api.put('/updateTeamAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], teamController.updateTeamAdmin);
api.delete('/deleteTeamAdmin/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], teamController.deleteTeamAdmin);


//ng2Charts//
api.get('/ng2charts', mdAuth.ensureAuth, teamController.ng2charts);

module.exports = api;