'use strict'

const mongoose = require('mongoose');

const tournamentSchema = mongoose.Schema({
    name: String,
    description: String,
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    journeys: 
    [
        {type: mongoose.Schema.ObjectId, ref: 'Journey'}
    ],
    teams: 
    [
        {type: mongoose.Schema.ObjectId, ref: 'Team'}
    ] 
});

module.exports = mongoose.model('Tournament', tournamentSchema);