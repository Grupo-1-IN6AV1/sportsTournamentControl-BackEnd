'use strict'

const teamController = require('../controllers/team.controller');
const mdAuth = require('../services/authenticated');
const express = require('express');
const api = express.Router();

api.get('/teamTest', teamController.testTeam);
api.post('/createTeam', mdAuth.ensureAuth, teamController.createTeam);

module.exports = api;