'use strict'

const mongoose = require('mongoose');

const tournamentSchema = mongoose.Schema({
    name: String,
    description: String,
    user: {type: mongoose.Schema.ObjectId, ref: 'user'},
    journey: {type: mongoose.Schema.ObjectId, ref: 'journey'},
    teams: [
        {type: mongoose.Schema.ObjectId, ref: 'team'}
    ] 
});

module.exports = mongoose.model('Tournament', tournamentSchema);