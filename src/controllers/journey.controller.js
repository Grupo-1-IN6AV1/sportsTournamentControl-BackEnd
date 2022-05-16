'use strict'

//Importación del Modelo de Journey//
const Journey = require('../models/journey.model');
//Importación del Modelo de Torneo//
const Tournament = require('../models/tournament.model');
//Importación del Modelo de Torneo//
const Team = require('../models/team.model');

//Validación de Datos
const {validateData} = require('../utils/validate');
const {controlPoints} = require('../utils/controlPoints');

//F U N C I O N E S     P Ú B L I C A S//

//Función de Testeo//
exports.testJourney = (req, res) =>
{
    return res.send({message: 'Journey test is running.'});
}

//F U N C I O N E S     P R I V A D A S//

//------ U S U A R I O -----------//

//Registrar || Agregar Partidos//

//GETs Journeys || Ver Partidos//
exports.getJourneys = async (req, res) => {
    try 
    {
        const tournamentId = req.params.id;
        if (!tournamentId) return res.status(400).send({message: 'Tournament is require'});
        const checkJourney = await Tournament.findOne({ _id: tournamentId }).populate('journeys').lean();
        if (!checkJourney) return res.status(400).send({ message: 'Journeys Not Found' });
        const journeys = checkJourney.journeys
        return res.send({ message: 'Journey Found: ', journeys});
    } 
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journeys' });
    }
}


//ADD Result Journey//
exports.addMatch = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
            localTeam: params.localTeam,
            localScore: params.localScore,
            visitingTeam: params.visitingTeam,
            visitingScore: params.visitingScore,
        };

        //Valida data obligatoria
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        //Busca si exite un torneo
        const tournamentExist = await Tournament.findOne({ _id: data.tournament });
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament Not Found.' })

        //Busca si exite esa jornada dentro del torneo
        const journeyExist = await Tournament.findOne({ $and: [{ _id: data.tournament }, { journeys: journeyId }] });
        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found.' })

        //Valida si el equipo local ya jugo en esa jornada
        const matchExistLocal = await Journey.findOne({ $and: [{ _id: journeyId}, {$or:[{'matches.localTeam': data.localTeam},{'matches.visitingTeam': data.localTeam}]}]})
        if(matchExistLocal) return res.status(400).send({message: 'One of the teams already played on this journey'});

        //Valida si el equipo visitante ya jugo en esa jornada
        const matchExistVisiting = await Journey.findOne({ $and: [{ _id: journeyId}, {$or:[{'matches.localTeam': data.visitingTeam},{'matches.visitingTeam': data.visitingTeam}]}]})
        if(matchExistVisiting) return res.status(400).send({message: 'One of the teams already played on this journey'});
        
        //Busca si ya existen los equipos dentro del torneo
        const teamLocal = await Tournament.findOne({ $and: [{ _id: data.tournament }, { 'teams.team': data.localTeam }] }).populate('teams').lean();
        if (!teamLocal)
            return res.status(400).send({ message: 'Team Local not found in this Tournament.' });

        const teamVisiting = await Tournament.findOne({ $and: [{ _id: data.tournament }, { 'teams.team': data.visitingTeam }] }).populate('teams').lean();
        if (!teamVisiting)
            return res.status(400).send({ message: 'Team Visiting not found in this Tournament' })
        if (data.localTeam !== data.visitingTeam) {

            //AGREGAR DATOS//
            //Data de Partidos -> Arreglo//

            //Se llama a la funcion para que haga la logica del partido//
            const dataTeams = await controlPoints(data);

            //Actualiza los datos del equipo Local
            const updateDataLocalTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": data.localTeam }] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": dataTeams.teamPointsLocal,
                        "teams.$.playedMatches": 1,
                        "teams.$.wonMatches": dataTeams.wonMatchesLocal,
                        "teams.$.tiedMatches": dataTeams.tiedMatchesLocal,
                        "teams.$.lostMatches": dataTeams.lostMatchesLocal,
                        "teams.$.proGoals": data.localScore,
                        "teams.$.againstGoals": data.visitingScore,
                        "teams.$.differenceGoals": dataTeams.differenceGoalsLocal
                    }
                },
                { new: true }).lean();

            //Actualiza los datos del equipo visitante
            const updateDataVisitingTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": data.visitingTeam }] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": dataTeams.teamPointsVisiting,
                        "teams.$.playedMatches": 1,
                        "teams.$.wonMatches": dataTeams.wonMatchesVisiting,
                        "teams.$.tiedMatches": dataTeams.tiedMatchesVisiting,
                        "teams.$.lostMatches": dataTeams.lostMatchesVisiting,
                        "teams.$.proGoals": data.visitingScore,
                        "teams.$.againstGoals": data.localScore,
                        "teams.$.differenceGoals": dataTeams.differenceGoalsVisiting
                    }
                },
                { new: true }).lean();

            //Agrega el  Partido a la Jornada//
            const newMatchJourney = await Journey.findOneAndUpdate({ _id: journeyId },
                { $push: { matches: data } },
                { new: true });
            return res.send({ message: 'Added New Match to Journey', newMatchJourney })
        }
        else {
            return res.status(400).send({ message: "Invalid Match, Teams are equals." });
        }
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error creating Match.', err });
    }
}

//GETs || Obtener Partidos//
exports.getMatches = async (req, res) => 
{
    try 
    {
        const journeyId = req.params.id;

        const journeyExist = await Journey.findOne({ _id: journeyId}).populate('matches.localTeam matches.visitingTeam');
        const match = await journeyExist.matches;
        if (!match) 
                return res.send({ message: 'Match Not Found' }); 
            
            return res.send({ messsage: 'Match Found:', match });                    
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Match', err});
    }
}


exports.getJourney = async (req, res) => {
    try 
    {
        const journeyId = req.params.id;
        const journey = await Journey.findOne({ _id: journeyId }).populate('matches.localTeam matches.visitingTeam').lean();
        if (!journey)
            return res.status(400).send({ message: 'Journeys Not Found' })

        return res.send({ message: 'Journey Found: ', journey });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journeys' });
    }
}


exports.deleteJourney = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
        };

        //Valida data obligatoria
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        //Busca si exite un torneo
        const tournamentExist = await Tournament.findOne({ _id: data.tournament });
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament Not Found.' })

        //Busca si exite esa jornada dentro del torneo
        const journeyExist = await Tournament.findOne({ $and: [{ _id: data.tournament }, { journeys: journeyId }] });
        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found or Already Deleted.' })

        const journey = await Journey.findOne({ _id: journeyId}).populate('matches.localTeam matches.visitingTeam');
        if(!journey) return res.status(400).send({message: 'Journey Not Found or Already Deleted.'});
        const matches = journey.matches;

        for (let match of matches) {

            const SearchMatch = await journey.matches.id(match._id);

            //Se llama a la funcion para que haga la logica del partido//
            const dataTeams = await controlPoints(SearchMatch);

            //Actualiza los datos del equipo Local
            const updateDataLocalTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": SearchMatch.localTeam._id}] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": -(dataTeams.teamPointsLocal),
                        "teams.$.playedMatches": -1,
                        "teams.$.wonMatches": -(dataTeams.wonMatchesLocal),
                        "teams.$.tiedMatches": -(dataTeams.tiedMatchesLocal),
                        "teams.$.lostMatches": -(dataTeams.lostMatchesLocal),
                        "teams.$.proGoals": -(SearchMatch.localScore),
                        "teams.$.againstGoals": -(SearchMatch.visitingScore),
                        "teams.$.differenceGoals": -(dataTeams.differenceGoalsLocal)
                    }
                },
                { new: true }).lean();

            //Actualiza los datos del equipo visitante
            const updateDataVisitingTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": SearchMatch.visitingTeam._id }] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": -(dataTeams.teamPointsVisiting),
                        "teams.$.playedMatches": -1,
                        "teams.$.wonMatches": -(dataTeams.wonMatchesVisiting),
                        "teams.$.tiedMatches": -(dataTeams.tiedMatchesVisiting),
                        "teams.$.lostMatches": -(dataTeams.lostMatchesVisiting),
                        "teams.$.proGoals": -(SearchMatch.visitingScore),
                        "teams.$.againstGoals": -(SearchMatch.localScore),
                        "teams.$.differenceGoals": -(dataTeams.differenceGoalsVisiting)
                    }
                },
                { new: true }).lean();

                const deleteMatchJorney = await Journey.findOneAndUpdate(
                    {_id: journeyId},
                    {$pull:{ 'matches': { '_id': match._id}}},{ new: true }).lean();
            }
            //Eliminar el  Partido a la Jornada//
            return res.send({message: 'Journey deleted successfully ', matches})
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error creating Match.', err });
    }
}

//GETs || Obtener Partidos//
exports.getMatchesAdmin = async (req, res) => 
{
    try 
    {
        const journeyId = req.params.id;

        const journeyExist = await Journey.findOne({ _id: journeyId }).populate('matches.localTeam matches.visitingTeam');
        const match = await journeyExist.matches;
        if (!match) 
                return res.send({ message: 'Match Not Found' }); 
            
            return res.send({ messsage: 'Match Found:', match });                    
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Match', err});
    }
}

exports.deleteMatch = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const params = req.body;
        let data =
        {
            matchId: params.matchId,
            tournament: params.tournament
        };

        //Valida data obligatoria
        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const journey = await Journey.findOne({ _id: journeyId}).populate('matches.localTeam matches.visitingTeam');
        if(!journey) return res.status(400).send({message: 'Journey Not Found or Already Deleted.'});
        const matches = journey.matches.id(data.matchId);


            //Se llama a la funcion para que haga la logica del partido//
            const dataTeams = await controlPoints(matches);

            //Actualiza los datos del equipo Local          const checkGames = await Tournament.findOne(
            
            const updateDataLocalTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": matches.localTeam._id}] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": -dataTeams.teamPointsLocal,
                        "teams.$.playedMatches": -1,
                        "teams.$.wonMatches": -dataTeams.wonMatchesLocal,
                        "teams.$.tiedMatches": -dataTeams.tiedMatchesLocal,
                        "teams.$.lostMatches": -dataTeams.lostMatchesLocal,
                        "teams.$.proGoals": -matches.localScore,
                        "teams.$.againstGoals": -matches.visitingScore,
                        "teams.$.differenceGoals": -dataTeams.differenceGoalsLocal
                    }
                },
                { new: true }).lean();

            //Actualiza los datos del equipo visitante
            const updateDataVisitingTeam = await Tournament.findOneAndUpdate(
                { $and: [{ _id: data.tournament }, { "teams.team": matches.visitingTeam._id }] },
                {
                    $inc:
                    {
                        "teams.$.teamPoints": -(dataTeams.teamPointsVisiting),
                        "teams.$.playedMatches": -1,
                        "teams.$.wonMatches": -(dataTeams.wonMatchesVisiting),
                        "teams.$.tiedMatches": -(dataTeams.tiedMatchesVisiting),
                        "teams.$.lostMatches": -(dataTeams.lostMatchesVisiting),
                        "teams.$.proGoals": -(matches.visitingScore),
                        "teams.$.againstGoals": -(matches.localScore),
                        "teams.$.differenceGoals": -(dataTeams.differenceGoalsVisiting)
                    }
                },
                { new: true }).lean();

                const deleteMatchJorney = await Journey.findOneAndUpdate(
                    {_id: journeyId},
                    {$pull:{ 'matches': { '_id': matches._id}}},{ new: true }).lean();
            //Eliminar el  Partido a la Jornada//
            return res.send({message: 'Journey deleted successfully ', matches})
    }
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting Match.', err });
    }
}