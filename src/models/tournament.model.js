'use strict'

const mongoose = require('mongoose');

const tournamentSchema = mongoose.Schema({
    name: String,
    description: String,
    user: {type: mongoose.Schema.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Tournament', tournamentSchema);