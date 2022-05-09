'use strict'

const mongoose = require('mongoose');

const journeySchema = mongoose.Schema({
    name: String,
    startDate: Date,
    finalDate: Date,
    matches: [{
        date: Date,
        localTeam: {type: mongoose.Schema.ObjectId, ref: 'Team'},
        localScore: Number,
        visitingTeam: {type: mongoose.Schema.ObjectId, ref: 'Team'},
        visitingScore: Number
    }]
});

module.exports = mongoose.model('Journey', journeySchema);