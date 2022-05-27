'use strict'

const {validateData} = require('../utils/validate');
const Tournament = require('../models/tournament.model');
const User = require('../models/user.model');
const Team = require('../models/team.model');
const Journey = require('../models/journey.model');

exports.tournamentTest = (req, res)=>
{
    return res.send({message: 'Team test is running.'});
}

//F U N C I O N E S     P R I V A D A S//

//------ U S U A R I O -----------//

//Registrar || Agregar Torneos//

exports.createTournament = async(req, res)=>
{
    try
    {
        const params = req.body;
        const userId = req.user.sub;
        const data = 
        {
            user: userId,
            name: params.name,
            description: params.description,
        };
        const msg = validateData(data);
            if(msg) return res.status(400).send(msg);
        
        const tournamentExist = await Tournament.findOne(
        {
            $and:
            [
                    {user: userId},
                    {name: params.name}
            ]
        });
        
        if(tournamentExist)
            return res.status(400).send({message:'This tournament already created.'})
            
        const tournament = new Tournament(data);
        await tournament.save();
        return res.send({message: 'Tournament created Successfully', tournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error creating Tournament'});
    }
}

exports.getTournaments =  async(req, res)=>{
    try
    {
        const tournaments = await Tournament.find({user: req.user.sub}).lean();
        if(!tournaments) 
            return res.status(400).send({message: 'Tournaments not found'});
        
        return res.send({tournaments});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Tournaments'});
    }
}

exports.getTournament =  async(req, res)=>
{
    try
    {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findOne(
        {$and:
            [
                {_id: tournamentId},
                {user: req.user.sub}
            ]
        }).lean();
        if(!tournament) return res.send({message: 'Tournament Not Found'});

        const teamsExist = await tournament.teams;
        if(teamsExist.length == 0)
            return res.send({message:'This tournament not contains Teams.', tournament})
        
        return res.send({tournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({message: 'Error getting Tournament',err});
    }
}

exports.updateTournament = async(req, res)=>{
    try{
        const tournamentId = req.params.id;
        const params = req.body;
        const userId = req.user.sub;
        
        const data =
        {
            name: params.name,
            description: params.description
        }

        const msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const tournamentExist = await Tournament.findOne({
            $and:
                [
                    {user: userId},
                    {_id: tournamentId}
                ]
        });

        if(!tournamentExist)
            return res.send({message: 'Tournament not found'});
        
        const alreadyTournament = await Tournament.findOne({
            $and:
                [
                    {user: userId},
                    {name: params.name}
                ]
        });

        if(alreadyTournament && alreadyTournament.name != tournamentExist.name) 
            return res.status(400).send({message: 'Tournament already taken'});
        const updateTournament = await Tournament.findOneAndUpdate(
            {$and:
                [
                    {_id: tournamentId},
                    {user: userId}         
                ]
            }, 
            {   
                user: data.user,
                name: data.name,
                description: data.description
            }, 
            {new:true});
            
        if(!updateTournament)
            return res.status(401).send({message: 'Tournament not Updated'});

        return res.send({message: 'Tournament updated successfully', updateTournament});

    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error updating Tournament'});
    }
}


exports.deleteTournament = async(req, res)=>
{
    try
    {
        const tournamentId = req.params.id;
        const userId = req.user.sub;
        const tournamentExist = await Tournament.findOne({
            $and:
                [
                    {user: userId},
                    {_id: tournamentId}
                ]
        });
        if(!tournamentExist) 
            return res.send({message: 'Tournament not found'});
        for(let journey of tournamentExist.journeys)
        {
                const deleteJourney = await Journey.findOneAndDelete({_id:journey})
        }
        const deleteTournament = await Tournament.findOneAndDelete({
            $and:
                [
                    {user: userId},
                    {_id: tournamentId}
                ]
        });

        if(!deleteTournament) 
            return res.status(400).send({message: 'Tournament not found or already delete.'});
        return res.send({message: 'Tournament deleted successfully', deleteTournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting Tournament'});
    }
}

//Agregar Equipos al Torneo//
exports.addTeamTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const params = req.body;
        const user = req.user.sub;
        const data =
        {
            team: params.teamId,
            proGoals: 0,
            againstGoals: 0,
            differenceGoals: 0,
            teamPoints: 0,
            wonMatches: 0,
            tiedMatches: 0,
            lostMatches: 0,
            playedMatches: 0
        };
        let msg = validateData(data);

        if (msg) return res.status(400).send(msg);
        
        const teamExist = await Team.findOne({ $and: [{ _id: params.teamId }, {user: user}]});
        if (!teamExist) return res.status(400).send({ message: 'Team not found' })
        const teamExistTournament = await Tournament.findOne({ $and: [{ _id: tournamentId }, { 'teams.team': params.teamId }] });
        if (teamExistTournament) return res.status(400).send({ message: 'Team is already in this tournament'})
        const tournamentExist = await Tournament.findOne({ $and: [{ _id: tournamentId }, { user: user }] });
        //Verificar que Exista el Torneo//
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });

        if (tournamentExist.teams.length > 9)
            return res.status(400).send({ message: 'Cannot add to team because maximum number of added teams reached' });

        //Pushear el Equipo al Torneo//
        await Tournament.findOneAndUpdate(
            { _id: tournamentId },
            { $push: { teams: data } },
            { new: true });

        //Automatizando las Jornadas//
        if (tournamentExist.teams.length > 0) {
            const newJourney = new Journey({ name: `Journey ${tournamentExist.teams.length}` })
            await newJourney.save();

            const pushJourneyTournament = await Tournament.findOneAndUpdate({ _id: tournamentId },
                { $push: { journeys: newJourney._id } }, { new: true });
        }

        const updateTournament = await Tournament.findOne({ _id: tournamentId }).populate('teams');
        if (updateTournament) return res.send({ message: 'Team create successfully in this tournament', updateTournament });
        return res.status(400).send({message: 'Error saving the team in this tournament'});
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}


//TABLA DE EQUIPOS ORDENADA POR PUNTOS//
exports.tableTournaments = async(req,res)=>
{
    try 
    {
        const tournamentId = req.params.id
        const tournament = await Tournament.findOne({_id: tournamentId}).populate('teams.team').lean();
        const teamsData = await tournament.teams
        teamsData.sort((a,b) =>{ return b.teamPoints-a.teamPoints; });
        return res.send({teamsData});
    } 
    catch (err) 
    {
        console.log(err);
        return err;
    }
}

//////////FUNCIONES ADMIN/////////////////
exports.createTournamentByAdmin = async(req, res)=>
{
    try
    {
        const params = req.body;
        const data = 
        {
            user: params.user,
            name: params.name,
            description: params.description,
        };
        const msg = validateData(data);
            if(msg) return res.status(400).send(msg);
        
        const tournamentExist = await Tournament.findOne(
        {
            $and:
            [
                    {user: params.user},
                    {name: params.name}
            ]
        });
        
        if(tournamentExist)
            return res.status(400).send({message:'This tournament already created.'})
            
        const tournament = new Tournament(data);
        await tournament.save();
        return res.send({message: 'Tournament created Successfully', tournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error creating Tournament'});
    }
}


exports.updateTournamentByAdmin = async(req, res)=>{
    try{
        const tournamentId = req.params.id;
        const params = req.body;
        let data =
        {
            name: params.name,
            description: params.description,
            user: params.user
        };
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);
        if(Object.entries(params).length === 0) return res.status(400).send({message: 'Empty parameters'});
        const userExist = await User.findOne({_id: req.user.sub});
        if(userExist.role != 'ADMIN') return res.send({message: 'Unauthorized to this function'});
        const tournamentExist = await Tournament.findOne({_id: tournamentId});
        if(!tournamentExist) return res.send({message: 'Tournament not found'});
        const alreadyTournament = await Tournament.findOne({name: params.name});
        if(alreadyTournament && tournamentExist.name != params.name) return  res.send({message: 'Tournament already taken'});
        const updateTournament = await Tournament.findOneAndUpdate({_id: tournamentId}, params, {new:true})
            .populate('user');
        if(!updateTournament) return res.status(401).send({message: 'Tournament not found'});
        return res.send({message: 'Tournament updated successfully', updateTournament})  ;     
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error updating Tournament'});
    }
}


exports.deleteTournamentByAdmin = async(req, res)=>{
    try{
        const tournamentId = req.params.id;
        const userId = req.user.sub;
        const userExist = await User.findOne({_id: userId});
        if(userExist.role != 'ADMIN') return res.status(400).send({message: 'Unauthorized to this function'});
        const tournamentExist = await Tournament.findOne({_id: tournamentId});
        if(!tournamentExist) return res.send({message: 'Tournament not found'});

        for(let journey of tournamentExist.journeys)
        {
            const deleteJourney = await Journey.findOneAndDelete({_id:journey})
        }

        const deleteTournament = await Tournament.findOneAndDelete({_id: tournamentId});
        if(!deleteTournament) return res.status(401).send({message: 'Tournament not found'});
        return res.send({message: 'Tournament deleted successfully', deleteTournament});
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting Tournament'});
    }
}


exports.getTournamentsByAdmin = async (req,res) =>
{
    try
    {
        const tournaments = await Tournament.find().populate('user').lean();
        if(tournaments.length == 0) 
            return res.send({message: 'Tournaments not found'});

        return res.send({tournaments});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Tournaments'});
    }
}


exports.getTournamentsByAdminForUser = async (req,res) =>
{
    try
    {
        const userId = req.params.id;
        const teams = await Team.find({user: userId}).populate('user').lean();
        if(teams.length == 0) 
            return res.status(400).send({message: 'Team not found'});

        return res.send({teams});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Tournaments'});
    }
}


exports.getTournamentByAdmin =  async(req, res)=>
{
    try
    {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findOne(
        { _id: tournamentId}).lean();
        if(!tournament) 
        return res.send({message: 'Tournament Not Found'});

        return res.send({message:'Tournament Found:', tournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({message: 'Error getting Tournament',err});
    }
}


exports.addTeamTournamentByAdmin = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const params = req.body;
        const data =
        {
            team: params.teamId,
            user: params.user,
            proGoals: 0,
            againstGoals: 0,
            differenceGoals: 0,
            teamPoints: 0,
            wonMatches: 0,
            tiedMatches: 0,
            lostMatches: 0,
            playedMatches: 0
        };
        let msg = validateData(data);

        if (msg) return res.status(400).send(msg);
        
        const teamExist = await Team.findOne({ $and: [{ _id: params.teamId }, {user: params.user}]});
        if (!teamExist) return res.status(400).send({ message: 'Team not found' })
        const teamExistTournament = await Tournament.findOne({ $and: [{ _id: tournamentId }, { 'teams.team': params.teamId }] });
        if (teamExistTournament) return res.status(400).send({ message: 'Team is already in this tournament'})
        const tournamentExist = await Tournament.findOne({ $and: [{ _id: tournamentId }, { user: params.user }] });
        //Verificar que Exista el Torneo//
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not found' });

        if (tournamentExist.teams.length > 9)
            return res.status(400).send({ message: 'Cannot add to team because maximum number of added teams reached' });

        //Pushear el Equipo al Torneo//
        await Tournament.findOneAndUpdate(
            { _id: tournamentId },
            { $push: { teams: data } },
            { new: true });

        //Automatizando las Jornadas//
        if (tournamentExist.teams.length > 0) {
            const newJourney = new Journey({ name: `Journey ${tournamentExist.teams.length}` })
            await newJourney.save();

            const pushJourneyTournament = await Tournament.findOneAndUpdate({ _id: tournamentId },
                { $push: { journeys: newJourney._id } }, { new: true });
        }

        const updateTournament = await Tournament.findOne({ _id: tournamentId }).populate('teams');
        if (updateTournament) return res.send({ message: 'Team create successfully in this tournament', updateTournament });
        return res.status(400).send({message: 'Error saving the team in this tournament'});
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}
