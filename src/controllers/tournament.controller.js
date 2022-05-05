'use strict'

const {validateData, searchTournament} = require('../utils/validate');
const Tournament = require('../models/tournament.model');

exports.tournamentTest = async (req, res)=>{
    await res.send({message: 'Controller torneo test run'});
}

exports.createTournament = async(req, res)=>{
    try{
        const params = req.body;
        const data = {
            name: params.name,
            description: params.description,
            user: params.user
        };
        const msg = validateData(data);
        if(msg) return res.status(400).send(msg);
        const alreadyTournament = await searchTournament(params.name);
        if(alreadyTournament) return res.send({message: 'Tournament is already created'});
        const tournament = new Tournament(data);
        await tournament.save();
        return res.send({message: 'Tournament created successfully', tournament});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error creating Tournament'});
    }
}

exports.viewTournaments =  async(req, res)=>{
    try{
        const tournaments = await Tournament.find().lean();
        if(tournaments.length == 0) return res.send({message: 'Tournaments not found'});
        return res.send({tournaments});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Tournaments'});
    }
}

exports.viewTournament =  async(req, res)=>{
    try{
        const tournamentId = req.params.id;
        const tournament = await Tournament.findOne({_id: tournamentId});
        if(!tournament) return res.send({message: 'Tournament not found'});
        return res.send({tournament});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Tournament'});
    }
}