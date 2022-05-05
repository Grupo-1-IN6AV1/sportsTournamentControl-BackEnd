'use strict'

const Team = require('../models/team.model');

const {validateData} = require('../utils/validate');

//F U N C I O N E S     P Ú B L I C A S//

/*Función de Testeo*/
exports.testTeam = (req, res) =>
{
    return res.send({message: 'Team test is running.'});
}


//F U N C I O N E S     P R I V A D A S//

//Registrar || Agregar Equipos//
exports.createTeam = async (req, res)=>
{
    try
    {
        const params = req.body;
        const data =
        {
            name: params.name,
            teamPoints: 0,
            playedMatches: 0,
            wonMatches: 0,
            tiedMatches: 0,
            lostMatches: 0,
            proGoals: 0,
            againGoals: 0,
            differenceGoals: 0
        };

        const msg = validateData(data);
        
        if(msg)
            return res.status(400).send(msg);
        
        //- Verficar que no exista el equipo.//
        let teamExist = await Team.findOne({name:params.name});
        if(teamExist)
        return res.send({message: 'Team is already created.'});

        data.description = params.description;
        data.country = params.country;

        const team = new Team(data);
        await team.save();
        return res.send({message: 'Team create Succesfully.', team});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error created Team.'});
    }
}


//ACTUALIZAR || Editar Equipo//
exports.updateTeam = async(req, res)=>
{
    try
    {
        const teamId = req.params.id;
        const params = req.body;

        const teamExist = await Team.findOne({_id: teamId});
        if(!teamExist)
            return res.send({message: 'Team not found'});

        //- Verificar que no se duplique con otro Equipo.//
        const notDuplicateTeam = await Team.findOne({name:params.name});
        if(notDuplicateTeam && notDuplicateTeam.name != teamExist.name)
            return res.send({message: 'Team is already exist.'});

        //- Actualizar el Equipo.//
        const teamUpdated = await Team.findOneAndUpdate
        (
            {_id: teamId},
            params,
            {new: true}
        ).lean();

        //- Verificar Actualización.//
        if(!teamUpdated)
            return res.send({message: ' Team not updated.'});
        return res.send({message: 'Team updated successfully.', teamUpdated});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error updating Team.'});
    }
}


//LISTAR || Ver Equipos de Usuario//
exports.getTeamsUser = async(req,res)=>
{
    try
    {
        const teams = await Team.find().lean();
        return res.send({message:'Teams Found',teams});
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send({err, message: 'Error getting Team.'});
    }
}