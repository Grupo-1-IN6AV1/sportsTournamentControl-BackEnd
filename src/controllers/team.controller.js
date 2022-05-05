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
