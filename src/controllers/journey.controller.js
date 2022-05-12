'use strict'

//Importación del Modelo de Journey//
const Journey = require('../models/journey.model');
//Importación del Modelo de Torneo//
const Tournament = require('../models/tournament.model');
//Importación del Modelo de Torneo//
const Team = require('../models/team.model');

//Validación de Datos
const { validateData } = require('../utils/validate');
const { controlPoints } = require('../utils/controlPoints');

//F U N C I O N E S     P Ú B L I C A S//

//Función de Testeo//
exports.testJourney = (req, res) => {
    return res.send({ message: 'Journey test is running.' });
}

//F U N C I O N E S     P R I V A D A S//

//------ U S U A R I O -----------//

//Registrar || Agregar Partidos//
exports.addMatch = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
            date: params.date,
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
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error creating Match.', err });
    }
}

//DELETE || Eliminar Partidos//
exports.deleteMatch = async (req, res) => {
    try {
        const userId = req.user.sub;
        const matchId = req.params.id
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
            journey: params.journey
        };
        let msg = validateData(data);

        if (msg)
            return res.status(400).send(msg);

        const tournamentExist = await Tournament.findOne({ _id: data.tournament });
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament Not Found.' })

        const journeyExist = await Tournament.findOne({ $and: [{ _id: data.tournament }, { journeys: data.journey }] });
        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found.' })

        const journey = await Journey.findOne({ _id: data.journey });
        const match = await journey.matches.id(matchId);
        if (!match)
            return res.send({ message: 'Match Not Found' });

        //ACTUALIZAR LOS DATOS DE LOS EQUIPOS//

        //Control de Puntaje//
        //Actualizar los Datos de los Equipos//
        const dataTeams = await controlPoints(match);

        //Local//

        const updateDataLocalTeam = await Tournament.findOneAndUpdate(
            { $and: [{ _id: data.tournament }, { "teams.team": match.localTeam }] },
            {
                $inc:
                {
                    "teams.$.teamPoints": -(dataTeams.teamPointsLocal),
                    "teams.$.playedMatches": -1,
                    "teams.$.wonMatches": -(dataTeams.wonMatchesLocal),
                    "teams.$.tiedMatches": -(dataTeams.tiedMatchesLocal),
                    "teams.$.lostMatches": -(dataTeams.lostMatchesLocal),
                    "teams.$.proGoals": -(match.localScore),
                    "teams.$.againstGoals": -(match.visitingScore),
                    "teams.$.differenceGoals": -(dataTeams.differenceGoalsLocal)
                }
            }, { new: true }).lean();

        //Visitante//
        const updateDataVisitingTeam = await Tournament.findOneAndUpdate(
            { $and: [{ _id: data.tournament }, { "teams.team": match.visitingTeam }] },
            {
                $inc:
                {
                    "teams.$.teamPoints": -(dataTeams.teamPointsVisiting),
                    "teams.$.playedMatches": -1,
                    "teams.$.wonMatches": -(dataTeams.wonMatchesVisiting),
                    "teams.$.tiedMatches": -(dataTeams.tiedMatchesVisiting),
                    "teams.$.lostMatches": -(dataTeams.lostMatchesVisiting),
                    "teams.$.proGoals": -(match.visitingScore),
                    "teams.$.againstGoals": -(match.localScore),
                    "teams.$.differenceGoals": -(dataTeams.differenceGoalsVisiting)
                }
            },
            { new: true }).lean();

        //Elimine el Partido de la Jornada//
        const deleteMatch = await Journey.findOneAndUpdate({ _id: data.journey },
            { $pull: { 'matches': { '_id': match._id } } },
            { new: true });

        if (!deleteMatch)
            return res.send({ message: 'Match not Delete.' })

        return res.send({ message: 'Deleted Match Successfully ', deleteMatch });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting Match', err });
    }
}


//GETs || Obtener Partidos//
exports.getMatch = async (req, res) => {
    try {
        const matchId = req.params.id;
        const userId = req.user.sub;
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
            journey: params.journey
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);
        const tournamentExist = await Tournament.findOne(
            { $and: [{ _id: data.tournament }, { journeys: data.journey }, { user: userId }] });

        if (!tournamentExist)
            return res.status(400).send({ message: 'Match Not Found' });

        const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
        const match = await journey.matches.id(matchId);
        if (!match)
            return res.send({ message: 'Match Not Found' });

        return res.send({ messsage: 'Match Found:', match });


    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Match', err });
    }
}


//GETs || Obtener Partidos//
exports.getMatches = async (req, res) => {
    try {
        const userId = req.user.sub;
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
            journey: params.journey
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const tournament = await Tournament.findOne(
            { $and: [{ _id: data.tournament }, { journeys: data.journey }, { user: userId }] });

        if (!tournament)
            return res.status(400).send({ message: 'Matches Not Found' });

        const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
        const matches = journey.matches;

        if (!matches)
            return res.send({ message: 'Matches Not Found.' });

        return res.send({ messsage: 'Matches Found:', matches });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Matches', err });
    }
}


//------ A D M I N I S T R A D O R -----------//

//Get || Obtener Partido//
exports.getJourneyAdmin = async (req, res) => {
    try {
        const journeyId = req.params.id;
        const params = req.body;
        let data = {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);
        const checkTournament = await Tournament.findOne({ _id: data.tournament, journeys: journeyId }).populate('journeys').lean();

        if (!checkTournament)
            return res.status(400).send({ message: 'Journey Not Found.' })

        const journey = await Journey.findOne({ _id: journeyId }).populate("matches.localTeam matches.visitingTeam");
        if (!journey)
            return res.send({ message: 'Journey Not Found.' });

        return res.send({ messsage: 'Journey Found: ', journey });

    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journey', err })
    }
}


exports.getJourneysAdmin = async (req, res) => {
    try {
        const params = req.body;
        let data =
        {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);
        const checkJourney = await Tournament.findOne({ _id: data.tournament }).populate('journeys').lean();
        const journeys = checkJourney.journeys
        if (!checkJourney)
            return res.status(400).send({ message: 'Journeys Not Found' })

        return res.send({ message: 'Journey Found: ', journeys });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journeys' });
    }
}


exports.getMatchesAdmin = async (req, res) => {
    try {
        const params = req.body;
        let data = {
            tournament: params.tournament,
            journey: params.journey
        };

        let msg = validateData(data);
        if (msg)
            return res.status(400).send(msg);

        const tournamentExist = await Tournament.findOne({ _id: data.tournament, journeys: data.journey }).populate('journeys').lean();
        if (!tournamentExist)
            return res.status(400).send({ message: 'Matchs Not Founds.' })

        const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
        const matches = journey.matches;

        if (!matches)
            return res.send({ message: 'Matches Not Founds.' });

        return res.send({ messsage: 'Matches Found:', matches });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Matches', err });
    }
}


exports.deleteMatchAdmin = async (req, res) => {
    try {
        const matchId = req.params.id
        const params = req.body;
        let data = {
            tournament: params.tournament,
            journey: params.journey
        };
        let msg = validateData(data);

        if (msg)
            return res.status(400).send(msg);


        const tournamentExist = await Tournament.findOne({ _id: data.tournament });
        if (!tournamentExist)
            return res.status(400).send({ message: 'Tournament Not Found.' })

        const journeyExist = await Tournament.findOne({ _id: data.tournament, journeys: data.journey });

        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found' })

        const journey = await Journey.findOne({ _id: data.journey });
        const match = await journey.matches.id(matchId);
        if (!match)
            return res.send({ message: 'Match Not Found' });

        //ACTUALIZAR LOS DATOS DE LOS EQUIPOS//

        //Control de Puntaje//
        //Actualizar los Datos de los Equipos//
        const dataTeams = await controlPoints(match);

        //Local//
        const updateDataLocalTeam = await Team.findOneAndUpdate(
            { _id: match.localTeam },
            {
                $inc:
                {
                    teamPoints: -(dataTeams.teamPointsLocal),
                    playedMatches: -1,
                    wonMatches: -(dataTeams.wonMatchesLocal),
                    tiedMatches: -(dataTeams.tiedMatchesLocal),
                    lostMatches: -(dataTeams.lostMatchesLocal),
                    proGoals: -(match.localScore),
                    againGoals: -(match.visitingScore),
                    differenceGoals: -(dataTeams.differenceGoalsLocal)
                }
            },
            { new: true }).lean();

        //Visitante//
        const updateDataVisitingTeam = await Team.findOneAndUpdate(
            { _id: match.visitingTeam },
            {
                $inc:
                {
                    teamPoints: -(dataTeams.teamPointsVisiting),
                    playedMatches: -1,
                    wonMatches: -(dataTeams.wonMatchesVisiting),
                    tiedMatches: -(dataTeams.tiedMatchesVisiting),
                    lostMatches: -(dataTeams.lostMatchesVisiting),
                    proGoals: -(match.visitingScore),
                    againGoals: -(match.localScore),
                    differenceGoals: (dataTeams.differenceGoalsVisiting)
                }
            },
            { new: true }).lean();

        //Elimine el Partido de la Jornada//
        const deleteMatch = await Journey.findOneAndUpdate({ _id: data.journey },
            { $pull: { 'matches': { '_id': match._id } } },
            { new: true });

        if (!deleteMatch)
            return res.send({ message: 'Match not Delete.' })

        return res.send({ message: 'Deleted Match Successfully ', deleteMatch });

    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting match', err });
    }
}