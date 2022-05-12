'use strict'

const mongoose = require('mongoose');

const tournamentSchema = mongoose.Schema({
    name: String,
    description: String,
    user: {type: mongoose.Schema.ObjectId, ref: 'User'},
    journeys: [{type: mongoose.Schema.ObjectId, ref: 'Journey'}],
    teams: [{
        team: {type: mongoose.Schema.ObjectId, ref: 'Team'},
        teamPoints : Number,
        playedMatches : Number,
        wonMatches : Number,
        tiedMatches : Number,
        lostMatches : Number,
        proGoals : Number,
        againstGoals : Number,
        differenceGoals : Number
    }] 
});

module.exports = mongoose.model('Tournament', tournamentSchema);