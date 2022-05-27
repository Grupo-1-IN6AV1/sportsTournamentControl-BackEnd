'use strict'

//Importación del Modelo de Equipo//
const Team = require('../models/team.model');
//Importación del Modelo de Torneo//
const Tournament = require('../models/tournament.model');
//Importación del Modelo de Jornada//
const Journey = require('../models/journey.model');

//Validación de Data//
const {validateData} = require('../utils/validate');

//Validación de Data//
const {controlPoints} = require('../utils/controlPoints');

//F U N C I O N E S     P Ú B L I C A S//

/*Función de Testeo*/
exports.testTeam = (req, res) => {
    return res.send({ message: 'Team test is running.' });
}


//F U N C I O N E S     P R I V A D A S//

//------ U S U A R I O -----------//

//Registrar || Agregar Equipos//
exports.createTeam = async (req, res) => {
    try {
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

        const userTeam = await Team.findOne({ $and: [{ user:user},{ name: params.name }] })
        if (userTeam)
            return res.status(400).send({ message: 'This Team already Exist.' })
        //Guardar el Equipo//
        const newTeam = new Team(data);
        await newTeam.save();
        return res.send({ message: 'Saving team Successfully', newTeam })
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}


//GETs || Obtener Equipos//
exports.getTeamsUser = async (req, res) => {
    try
    {
        const userId = req.user.sub;
       
        const teamsExist = await Team.find({user: userId}).lean();
    
        if (!teamsExist)
            return res.status(400).send({ message: 'Teams Not Found' });
    
        return res.send({ messsage: 'Teams Found:', teamsExist });
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting this Teams.' });
    }
}

exports.getTeamsUserJourney = async (req, res) => {
    try
    {
        const userId = req.params.id;
       
        const teamsExist = await Team.find({user: userId}).lean();
    
        if (!teamsExist)
            return res.status(400).send({ message: 'Teams Not Found' });
    
        return res.send({ messsage: 'Teams Found:', teamsExist });
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting this Teams.' });
    }
}


//UPDATE || Actualizar Equipos//
exports.updateTeam = async(req, res)=>
{
    try
    {
        const userId = req.user.sub;
        const teamId = req.params.id;
        const params = req.body;
        const data =
        {
            name: params.name,
            country: params.country,
            description: params.description,
        };
        let msg = validateData(data);

        if (msg)
            return res.status(400).send(msg);
            
        const teamExist = await Team.findOne({_id: teamId});
        if(!teamExist)
                return res.status(400).send({message: 'Team not found'});
    
            //- Verificar que no se duplique con otro Equipo.//
        const notDuplicateTeam = await Team.findOne({name:params.name});
            if(notDuplicateTeam && notDuplicateTeam.name != teamExist.name)
                return res.status(400).send({message: 'Team is already exist.'});
    
            //- Actualizar el Equipo.//
            const teamUpdated = await Team.findOneAndUpdate
            (
                {_id: teamId},
                params,
                {new: true}
            ).lean();
    
            //- Verificar Actualización.//
            if(!teamUpdated)
                return res.status(400).send({message: ' Team not updated.'});
            return res.send({message: 'Team updated successfully.', teamUpdated});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error updating Team.'});
    }
}


//DELETE || Eliminar Equipos//
exports.deleteTeam = async (req, res) => {
    try 
    {
        const teamId = req.params.id;
        const userId = req.user.sub;

        const teamExist = await Team.findOne({ $and: [{ user:userId },{_id:teamId} ]}).lean();

        if (!teamExist)
            return res.status(400).send({ message: 'Team Not Found.}' });

        //Eliminando de Torneos//
        const removeTeamTournament = await Tournament.findOneAndUpdate({ $and: [{ user: teamExist.user }, { 'teams.team': teamId }] },
            { $pull: { 'teams': { 'team': teamId } } }, { new: true });
        //Eliminando de Journeys//
        const removeJourney = await Journey.findOne({ $or: [{ 'matches.localTeam': teamId }, { 'matches.visitingTeam': teamId }] });
        if (!removeJourney) { }
        else {
            const removeMatchJourney1 = await Journey.findOneAndUpdate({_id: removeJourney._id },
                { $pull: { 'matches' : { 'localTeam' : teamId }} },
                { new: true });
            const removeMatchJourney2 = await Journey.findOneAndUpdate({_id: removeJourney._id },
                    { $pull: { 'matches' : { 'visitingTeam' : teamId }} },
                    { new: true });
        }

        const deleteTeam = await Team.findOneAndDelete({ _id: teamId }).lean();
        if (!deleteTeam)
            return res.status(500).send({ message: 'Team Not Found or Already Delete.' });

        return res.send({ message: 'Team Delete Successfully', deleteTeam });
    }
    catch (err) {
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
            name: params.name,
            country: params.country,
            description: params.description
        };
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const teamExist = await Team.findOne({ _id: teamId }).lean();

        if(!teamExist)
            return res.status(400).send({ message: 'Team not Found' })
        
        const updateTeam = await Team.findOneAndUpdate({ _id: teamId }, params, { new: true }).lean();
        if (!updateTeam) 
            return res.status(400).send({ message: 'Team has not been Updated' })
                    
        return res.send({ message: 'Team Updated', updateTeam });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error updating the team' });
    }
}


//cons Update tema//
//UPDATE: actualiza equipo.
exports.deleteTeamAdmin = async (req, res) => {
    try {
        var teamId = req.params.id;

        const teamExist = await Team.findOne({ _id: teamId }).lean();

        if (!teamExist)
            return res.status(400).send({ message: 'Team Not Found.}' });
        
        const deleteTeam = await Team.findOneAndDelete({ _id: teamId }).lean();
        if (!deleteTeam)
            return res.status(500).send({ message: 'Team Not Found or Already Delete.' });

        return res.send({ message: 'Team Delete Successfully', deleteTeam });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting this Team.' });
    }
}



//GET || Obtener Equipo//
exports.getTeam = async (req, res) => {
    try {
        const teamId = req.params.id;

        const team = await Team.findOne({ _id: teamId }).populate('user').lean();
        if (!team) {
            return res.status(400).send({ message: 'This Team does not exist.' })
        }
        else {
            return res.send({ message: 'Team Found:', team });
        }
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ message: 'Error getting Team.', err });
    }
};


//GETs | Obtener Equipos//
exports.getTeamsAdmin = async (req, res) => {
    try {
        const teamsExist = await Team.find().populate('user').lean();

        if (!teamsExist)
            return res.status(400).send({ message: 'Teams Not Found' });

        return res.send({ messsage: 'Teams Found:', teamsExist });

    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Teams.', err });
    }
}

//CREATE | Agregar Equipos//
exports.createTeamAdmin = async (req, res) => {
    try {
        const params = req.body;
        const data =
        {
            user: params.user,
            name: params.name,
            country: params.country,
            description: params.description,
        };

        let msg = validateData(data);
        if (msg) return res.status(400).send(msg);

        const userTeam = await Team.findOne({ $and: [{ user: params.user }, { name: params.name }] })

        if (userTeam)
            return res.status(400).send({ message: 'This user already owns this Team.' })

        //Guardar el Equipo//
        const newTeam = new Team(data);
        await newTeam.save();
        return res.send({ message: 'Saving team successfully', newTeam })
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error saving this Team.', err });
    }
}


//P A R T E    D E     E S T A D Í S T I C A//

//------ ng2Charts -----------//

exports.ng2charts = async (req, res) => {
    try {
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
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament not Found' })

        const teamsExist = tournamentExist.teams.sort((teamLocal, teamVisiting) => {
            return - teamLocal.proGoals + teamVisiting.proGoals
        });

        if (!teamsExist)
            return res.status(400).send({ message: 'Teams Not Founds.' })

        return res.send({ messsage: 'Teams Founds:', teamsExist });

    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting teams.' });
    }
} 