'use strict'

const {validateData} = require('../utils/validate');
const Tournament = require('../models/tournament.model');
const User = require('../models/user.model');
const Team = require('../models/team.model');

exports.tournamentTest = (req, res)=>
{
    return res.send({message: 'Team test is running.'});
}

exports.createTournament = async(req, res)=>
{
    try
    {
        const params = req.body;
        const userId = req.user.sub;
        const data = 
        {
            name: params.name,
            description: params.description,
            user: userId,
        };
        const msg = validateData(data);
            if(msg) return res.status(400).send(msg);
        
        const tournamentExist = await Tournament.findOne(
        {
            $and:
            [
                    {user: userId},
                    {name: data.name}
            ]
        });
        
        if(tournamentExist)
            return res.send({message:'This tournament already created.'})
            
        const tournament = new Tournament(data);
        await tournament.save();
        return res.send({message: 'Tournament created successfully', tournament});
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
            return res.send({message: 'Tournament already taken'});
        const updateTournament = await Tournament.findOneAndUpdate(
            {$and:
                [
                    {_id: tournamentId},
                    {user: userId}         
                ]
            }, 
            params, 
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
        const deleteTournament = await Tournament.findOneAndDelete({
            $and:
                [
                    {user: userId},
                    {_id: tournamentId}
                ]
        });

        if(!deleteTournament) 
            return res.status(401).send({message: 'Tournament not found or already delete.'});
        return res.send({message: 'Tournament deleted successfully', deleteTournament});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting Tournament'});
    }
}



exports.updateTournamentByAdmin = async(req, res)=>{
    try{
        const tournamentId = req.params.id;
        const params = req.body;
        const userId = req.user.sub;
        if(Object.entries(params).length === 0) return res.status(400).send({message: 'Empty parameters'});
        const userExist = await User.findOne({_id: userId});
        if(userExist.role != 'ADMIN') return res.send({message: 'Unauthorized to this function'});
        const tournamentExist = await Tournament.findOne({_id: tournamentId});
        if(!tournamentExist) return res.send({message: 'Tournament not found'});
        const alreadyTournament = await Tournament.findOne({name: params.name});
        if(alreadyTournament && tournamentExist.name != params.name) return  res.send({message: 'Tournament already taken'});
        const updateTournament = await Tournament.findOneAndUpdate({_id: tournamentId}, params, {new:true});
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
        if(userExist.role != 'ADMIN') return res.send({message: 'Unauthorized to this function'});
        const tournamentExist = await Tournament.findOne({_id: tournamentId});
        if(!tournamentExist) return res.send({message: 'Tournament not found'});
        const deleteTournament = await Tournament.findOneAndDelete({_id: tournamentId});
        if(!deleteTournament) return res.status(401).send({message: 'Tournament not found'});
        return res.send({message: 'Tournament deleted successfully', deleteTournament})  ;
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error deleting Tournament'});
    }
}


exports.getTournamentsByAdmin = async (req,res) =>
{
    try
    {
        const tournaments = await Tournament.find().lean();
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


//Registrar || Agregar equipos en torneos//
exports.addTeamTournament = async (req, res) => {
    try {
        const params = req.body;
        const user = req.user.sub;
        const tournamentId = req.params.id;
        const teamID = params.team

        const tournamentExist = await Tournament.findOne({ _id:tournamentId });

        //Verificar que Exista la el torneo//
        if (!tournamentExist)
            return res.status(401).send({ message: 'Tournament not Found.' })

        const msg = validateData(params);
        if (msg)
            return res.status(400).send(msg);

        //Busca el Equipo por ID y Usuario//
        const teamExist = await Team.findOne({$and:[{ _id: teamID },{ user: user }]}).lean();
        if (!teamExist)
            return res.send({ message: 'Team not Found.' });

        //Validar que ese equipo ya exista en el torneo//
        const teamExiste = await tournamentExist.teams.id(teamID);
     

        //Validar la cantidad máxima de equipos//
        const countTeams = tournamentExist.teams.length;
        if(countTeams < 10 ){
            //Agrega el Primer Partido a la Jornada//
            const newTeamTournament = await Tournament.findOneAndUpdate({ _id: tournamentId }, { $push: { teams:{ team:teamID }} },{ new: true });
            return res.send({ message: 'Added New Team to Tournament', newTeamTournament });
        }else return res.send({message: 'Cannot add to team because maximum number of added teams reached'})

        
    } catch (err) {
        console.log(err);
        return err;
    }
}

exports.removeTeamToTournament = async(req,res)=>{
    try{
        const params = req.body;
        const userId = req.user.sub;
        const tournamentId = req.params.id;
        const tournamentExist = await Tournament.findOne({
            $and:
            [
                {user: userId},
                {_id: tournamentId}
            ]
        });
        if(!tournamentExist) return res.status(401).send({message: 'Tournament not found'});
        const teamExist = await Team.findOne({
            $and:
            [
                {user: userId},
                {_id: params.teamId}
            ]
        });
        if(!teamExist)  return res.status(401).send({message: 'Team not found'});
        const teamAlready = await Tournament.findOne({
            $and:
            [
                {_id: tournamentId},
                {teams: params.teamId}
            ]
        });
        if(!teamAlready) return res.status(401).send({message: 'Team does not in Tournament'});
        for(let team of tournamentExist.teams){
            //console.log(tournamentExist.teams._id)
            if(team._id != params.teamId) continue;
            const removeTeam = await Tournament.findOneAndUpdate({_id: tournamentId}, 
                {$pull: {'teams':  team._id}}, {new:true});
            if(!removeTeam) return res.status(401).send({message: 'Team can not remove of tournament'});
            return res.send({message: 'Team deleted of Tournament', removeTeam}); 
        }
    }catch(err){
        console.log(err);
        return res.status(500).send({err, message: 'Error adding Tournament'});
    }
}