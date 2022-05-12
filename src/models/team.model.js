'use strict'

const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
    user: {type: mongoose.Schema.ObjectId, ref:'User'},
    name: String,
    description: String,
    country: String,
});

module.exports = mongoose.model('Team', teamSchema);