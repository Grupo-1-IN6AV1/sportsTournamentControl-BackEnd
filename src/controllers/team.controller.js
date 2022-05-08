'use strict'


//Importación del Modelo de Equipo//
const Team = require('../models/team.model');
//Importación del Modelo de Torneo//
const Tournament = require('../models/tournament.model');
//Importación del Modelo de Jornada//
const Journey = require('../models/journey.model');

//Validación de Data//
const {validateData} = require('../utils/validate');
const {checkUpdateTeams} = require('../utils/validate');

//F U N C I O N E S     P Ú B L I C A S//

/*Función de Testeo*/
exports.testTeam = (req, res) => {
    return res.send({ message: 'Team test is running.' });
}


//F U N C I O N E S     P R I V A D A S//

//------ U S U A R I O -----------//

//Registrar || Agregar Equipos//
exports.createTeam = async (req, res) => 
{
    try 
    {
        const params = req.body;
        const user = req.user.sub;
        const data = 
        {
            tournament: params.tournament,
            user: user,
            name: params.name,
            country: params.country,
            description: params.description,
            proGoals: 0,
            againGoals: 0,
            differenceGoals: 0,
            teamPoints:0,
            wonMatches:0,
            tiedMatches:0,
            lostMatches:0,
            playedMatchs: 0,
        };
        
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

            const tournamentExist = await Tournament.findOne({$and:[ {_id: data.tournament},{user:user}]});
            //Verificar que Exista el Torneo//
            if (!tournamentExist) 
                return res.status(400).send({message:'Cant add Team to this Tournament'});
                
            if(tournamentExist.teams.length > 9)
            return res.status(400).send({message:'Cannot add to team because maximum number of added teams reached'});

            //Guardar el Equipo//
            const newTeam = new Team(data);
            await newTeam.save();

            //Pushear el Equipo al Torneo//
            await Tournament.findOneAndUpdate(
                {_id: data.tournament},
                {$push:{teams: newTeam._id}},
                {new:true});

            //Automatizando las Jornadas//
            if (tournamentExist.teams.length>0)
            {
                const newJourney = new Journey({name:`Journey ${tournamentExist.teams.length}`})
                await newJourney.save();
                
                const pushJourneyTournament = await Tournament.findOneAndUpdate({ _id: data.tournament }, 
                    { $push: { journeys: newJourney._id } },{ new: true });
            }

            const updateTournament = await Tournament.findOne({ _id: data.tournament}).populate('teams')
                return res.send({ message: 'Team create successfully in this tournament', updateTournament });
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}


//GET || Obtener Un Equipo//
exports.getTeamUser = async (req, res) => 
{
    try 
    {
        const teamId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;
        const data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);

        if(msg)
            return res.status(400).send(msg);
        
        const teamExist = await Tournament.findOne({$and:[{_id: data.tournament}, {teams: teamId}, {user: userId}]}).populate('teams').lean();

        if(!teamExist) 
            return res.status(400).send({ message: 'Team not Found in this Tournament.' })
       
        const team = await Team.findOne({ _id: teamId});
        if (!team) 
            return res.send({ message: 'Team Not Found.' });

        return res.send({ messsage: 'Team Found:', team }); 
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting this Team.' });
    }
}


//GETs || Obtener Equipos//
exports.getTeamsUser = async (req, res) => 
{
    try 
    {
        const userId = req.user.sub;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg); 

        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament},  {user: userId}]}).populate('teams').lean();

        if(!teamExist)
            return res.status(400).send({message: 'Teams Not Founds'});        
        
        return res.send({ messsage: 'Teams Founds:', teams:teamExist.teams});
        
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting this Teams.' });
    }
}


//UPDATE || Actualizar Equipos//
exports.updateTeam = async (req, res) => 
{
    try 
    {
        const teamId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };
        
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg); 
        
        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}, {user: userId}, {teams:teamId}]}).populate('teams').lean();

        if(!teamExist)
            return res.status(400).send({ message: 'Team not Found' })
            
        const checkparams = await checkUpdateTeams(params);
        if (checkparams === false) 
            return res.status(400).send({ message: 'Invalid Params to Update Team.' })
        
        const updateTeam = await Team.findOneAndUpdate({ _id: teamId }, params, { new: true }).lean();
        if (!updateTeam) 
            return res.send({ message: 'Team has not been Updated' })
                    
        return res.send({ message: 'Team Updated:', updateTeam })
    }  
    catch (err)
    {
        console.log(err);
        return res.status(500).send({ message: 'Error updating this Team.', err});
    }
}


//DELETE || Eliminar Equipos//
exports.deleteTeam = async (req, res) => 
{
    try 
    {
        const teamId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg) 
            return res.status(400).send(msg);
        
        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}, {user: userId}, {teams:teamId}]}).populate('teams').lean();
        
        if(!teamExist)
            return res.status(400).send({ message: 'Team not Found' })
        
        //Eliminando de Equipo//
        const deleteTeam = await Team.findOneAndDelete({ _id: teamId});
        //Eliminando de Torneos//
        const removeTeamTournament = await Tournament.findOneAndUpdate({$and:[{_id:data.tournament},{user: userId}]}, 
            { $pull: {'teams':teamId} }, {new:true});
        //Eliminando de Journeys//
        const removeJourney = await Journey.findOneAndDelete({_id:teamExist.journeys.at(-1)});
        const removeTeamJourney = await Tournament.findOneAndUpdate({journeys:removeJourney._id},
            {$pull: { 'journeys': removeJourney._id}},
            { new: true });
        if (!deleteTeam)
            return res.status(500).send({ message: 'Team Not Found or Already Delete.' });
        
        return res.send({ message: 'Team Delete Successfully', deleteTeam });
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting Team.', err });
    }
}


//------ A D M I N I S T R A D O R -----------//

//UPDATE || Actualizar Equipo//
exports.updateTeamAdmin = async (req, res) => {
    try {
        const teamId = req.params.id;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}, {teams:teamId}]}).populate('teams').lean();

        if(!teamExist)
            return res.status(400).send('Team Not Found.')
        
        const checkUpdated = await checkUpdateTeams(params);
        if (checkUpdated === false)
            return res.status(400).send({ message: 'Invalid Params to Update Team.' })
                
        const updateTeam = await Team.findOneAndUpdate({ _id: teamId }, params, { new: true }).lean();
        if (!updateTeam) 
            return res.send({ message: 'No se ha podido actualizar el equipo' })
        return res.send({ message: 'Team Updated:', updateTeam })

    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error actualizando el equipo' });
    }
}


//cons Update tema//
//UPDATE: actualiza equipo.

exports.deleteTeamAdmin = async (req, res) => {
    try 
    {
        const teamId = req.params.id;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg); {
            
        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}, {teams:teamId}]}).populate('teams').lean();

        if(!teamExist)
            return res.status(400).send({message:'Team Not Found.}'});

        //Eliminando de Equipo//
        const deleteTeam = await Team.findOneAndDelete({ _id: teamId});
        //Eliminando de Torneos//
        const removeTeamTournament = await Tournament.findOneAndUpdate({$and:[{_id:data.tournament}]}, 
            { $pull: {'teams':teamId} }, {new:true});
        //Eliminando de Journeys//
        const removeJourney = await Journey.findOneAndDelete({_id:teamExist.journeys.at(-1)});
        const removeTeamJourney = await Tournament.findOneAndUpdate({journeys:removeJourney._id},
            {$pull: { 'journeys': removeJourney._id}},
            { new: true });
        if (!deleteTeam)
            return res.status(500).send({ message: 'Team Not Found or Already Delete.' });

        return res.send({ message: 'Team Delete Successfully', deleteTeam });
    }
        
    } 
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deletin this Team.' });
    }
}



//GET || Obtener Equipo//
exports.getTeamAdmin = async (req, res) => 
{
    try 
    {
        const teamId = req.params.id;
        const params = req.body;

        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg) 
            return res.status(400).send(msg);
        
            const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}, {teams:teamId}]}).populate('teams').lean();

            if(!teamExist)
                return res.status(400).send({ message: 'Team Not Found in this Tournament.' })
            
            const team = await Team.findOne({ _id: teamId });
            if (!team) 
                return res.send({ message: 'Team has not been Updated' })
               
            return res.send({ messsage: 'Team Found:', team });
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Team.', err});
    }
}


//GETs | Obtener Equipos//
exports.getTeamsAdmin = async (req, res) => {
    try {
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg) 
            return res.status(400).send(msg);
        
        const teamExist = await Tournament.findOne(
            {$and:[{_id: data.tournament}]}).populate('teams').lean();
        
        if(!teamExist)
            return res.status(400).send({message:'Teams Not Found'});
            
        return res.send({ messsage: 'Team Founds:', teams:teamExist.teams});
        
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Teams.', err});
    }
}