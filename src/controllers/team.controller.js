'use strict'

//Importación del Modelo de Equipo//
const Team = require('../models/team.model');
//Importación del Modelo de Torneo//
const Tournament = require('../models/tournament.model');
//Importación del Modelo de Jornada//
const Journey = require('../models/journey.model');

//Validación de Data//
const {validateData} = require('../utils/validate');

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
            user: user,
            name: params.name,
            country: params.country,
            description: params.description,
        };
        
        let msg = validateData(data);
        if (msg) return res.status(400).send(msg);
            //Guardar el Equipo//
            const newTeam = new Team(data);
            await newTeam.save();
            return res.send({message: 'Saving team successfully', newTeam})
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
            { $pull: {'teams': {'team': params.teamId}}}, {new:true});
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
                
        const updateTeam = await Team.findOneAndUpdate({ _id: teamId }, params, { new: true }).lean();
        if (!updateTeam) 
            return res.send({ message: 'Failed to update team' })
        return res.send({ message: 'Team Updated:', updateTeam })

    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error updating the team' });
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


//P A R T E    D E     E S T A D Í S T I C A//

//------ ng2Charts -----------//

exports.ng2charts = async (req, res) => {
    try 
    {
        const user = req.user.sub;
        const params = req.body;
        let data = 
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg)
        return res.status(400).send(msg); 
        
        const tournamentExist = await Tournament.findOne({ _id: data.tournament }).populate('teams');
        if(!tournamentExist)
            return res.status(400).send({message:'Tournament not Found'})

        const teamsExist = tournamentExist.teams.sort((teamLocal, teamVisiting) => 
        {
                return - teamLocal.proGoals + teamVisiting.proGoals
        });

        if(!teamsExist)
            return res.status(400).send({message:'Teams Not Founds.'})

        return res.send({ messsage: 'Teams Founds:', teamsExist });
        
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting teams.' });
    }
} 