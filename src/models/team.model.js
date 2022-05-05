'use strict'

const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
    name: String,
    description: String,
    teamPoints: Number,
    playedMatches: Number,
    womMatches: Number,
    tiedMatches: Number,
    lostMatches: Number,
    proGoals: Number,
    againGoals: Number,
    differenceGoals: Number
});

module.exports = mongoose.model('Team', userSchema);