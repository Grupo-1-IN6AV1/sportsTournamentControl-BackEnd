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
exports.addMatch = async (req, res) => {
    try 
    {
        const user = req.user.sub;
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
        let msg = validateData(data);

        if (msg) 
            return res.status(400).send(msg);

        const journeyExist = await Tournament.findOne({$and:[ {_id: data.tournament},{journeys: journeyId}]});
        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found.' })
        
        const matchesJourney = await Journey.findOne({ _id: journeyId })
        if (matchesJourney.matches.length > journeyExist.journeys.length)
            return res.status(400).send({message: 'Maximum number of matches reached this Journey.'})

        const teamLocal = await Tournament.findOne({$and:[{_id: data.tournament},{teams: data.localTeam}]}).populate('teams').lean();
        if (!teamLocal) 
            return res.status(400).send({ message: 'Team Local not found in this Tournament.'});
                    
        const teamVisiting = await Tournament.findOne({$and:[{_id: data.tournament},{teams: data.visitingTeam}]}).populate('teams').lean();
        if (!teamVisiting) 
            return res.status(400).send({ message: 'Team Visiting not found in this Tournament' })
        if (data.localTeam !== data.visitingTeam)
        {
            //Busca el Equipo Local por ID y Usuario//|
            const localTeam = await Team.findOne
            ({_id: params.localTeam}).lean();
            if (!localTeam)
            return res.send({ message: 'Team Local not Found.'});

            //Busca el Equipo Visitante por ID y Usuario//
            const visitingTeam = await Team.findOne
            ({
                _id: params.visitingTeam,
            }).lean();
            if (!visitingTeam)
            return res.send({ message: 'Team Visiting not Found.' });

            //AGREGAR DATOS//
            //Data de Partidos -> Arreglo//

            //Actualizar los Datos de los Equipos//
            const dataTeams = await controlPoints(data);

            const updateDataLocalTeam = await Team.findOneAndUpdate(
                { _id: params.localTeam},
                {
                    $inc:
                    {
                        teamPoints: dataTeams.teamPointsLocal,
                        playedMatches: 1,
                        wonMatches: dataTeams.wonMatchesLocal,
                        tiedMatches: dataTeams.tiedMatchesLocal,
                        lostMatches: dataTeams.lostMatchesLocal,
                        proGoals: data.localScore,
                        againGoals: data.visitingScore,
                        differenceGoals: dataTeams.differenceGoalsLocal
                    }
                },
                { new: true }).lean();

            //Visitante
            const updateDataVisitingTeam = await Team.findOneAndUpdate(
                { _id: params.visitingTeam},
                {
                    $inc:
                    {
                        teamPoints: dataTeams.teamPointsVisiting,
                        playedMatches: 1,
                        wonMatches: dataTeams.wonMatchesVisiting,
                        tiedMatches: dataTeams.tiedMatchesVisiting,
                        lostMatches: dataTeams.lostMatchesVisiting,
                        proGoals: data.visitingScore,
                        againGoals: data.localScore,
                        differenceGoals: dataTeams.differenceGoalsVisiting
                    }
            },
            { new: true }).lean();
            
            //Agrega el  Partido a la Jornada//
            const newMatchJourney = await Journey.findOneAndUpdate({ _id: journeyId },
            { $push: { matches: data } },
            { new: true });
            return res.send({ message: 'Added New Match to Journey', newMatchJourney })
            } 
        else 
        {
            return res.status(400).send({ message: "Invalid Match, Teams are equals." });
        }
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error creating Match.', err });
    }
}

//DELETE || Eliminar Partidos//
exports.deleteMatch = async (req, res) => 
{
    try 
    {
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
        
        const journeyExist = await Tournament.findOne({$and:[ {_id: data.tournament},{journeys: data.journey}]});
        if (!journeyExist)
            return res.status(400).send({ message: 'Journey Not Found.' })
            
        const journey = await Journey.findOne({ _id: data.journey });
        const match = await journey.matches.id(matchId);
        if (!match)
            return res.send({ message: 'Match Not Found' }); 
        
        //Busca el Equipo Local por ID y Usuario//|
        const localTeam = await Team.findOne
        ({_id: match.localTeam}).lean();
        if (!localTeam)
        return res.send({ message: 'Team Local not Found.'});

        //Busca el Equipo Visitante por ID y Usuario//
        const visitingTeam = await Team.findOne
        ({
            _id: match.visitingTeam,
        }).lean();
        if (!visitingTeam)
        return res.send({ message: 'Team Visiting not Found.' });

        //ACTUALIZAR LOS DATOS DE LOS EQUIPOS//

        //Control de Puntaje//
        //Actualizar los Datos de los Equipos//
        const dataTeams = await controlPoints(match);

        //Local//
        const updateDataLocalTeam = await Team.findOneAndUpdate(
        { _id: match.localTeam},
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
            { _id: match.visitingTeam},
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
                { $pull: { 'matches': { '_id': match._id} } },
                { new: true });
            
            if(!deleteMatch)
                return res.send({message: 'Match not Delete.'})

            return res.send({ message: 'Deleted Match Successfully ', deleteMatch });
    } 
    catch (err)
    {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting Match', err});
    }
}


//GETs || Obtener Partidos//
exports.getMatch = async (req, res) => 
{
    try 
    {
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
                {$and:[ {_id: data.tournament},{journeys: data.journey},{user:userId}]});

            if(!tournamentExist)
                return res.status(400).send({ message: 'Match Not Found' });
             
            const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
            const match = await journey.matches.id(matchId);
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


//GETs || Obtener Partidos//
exports.getMatches = async (req, res) => 
{
    try 
    {
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
            {$and:[ {_id: data.tournament},{journeys: data.journey},{user:userId}]});

        if(!tournament)
            return res.status(400).send({message:'Matches Not Found'});

        const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
        const matches = journey.matches;

        if(!matches)
            return res.send({ message: 'Matches Not Found.' });

        return res.send({ messsage: 'Matches Found:', matches });      
    } 
    catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Matches', err});
    }
}


//------ A D M I N I S T R A D O R -----------//

//Get || Obtener Partido//
exports.getJourneyAdmin = async (req, res) => {
    try 
    {
        const journeyId = req.params.id;
        const params = req.body;
        let data = {
            tournament: params.tournament,
        };

        let msg = validateData(data);
        if (msg) 
            return res.status(400).send(msg);
        const checkTournament = await Tournament.findOne({_id: data.tournament, journeys: journeyId }).populate('journeys').lean();

        if(!checkTournament)
            return res.status(400).send({ message: 'Journey Not Found.'})

        const journey = await Journey.findOne({ _id: journeyId }).populate("matches.localTeam matches.visitingTeam");
        if (!journey) 
            return res.send({ message: 'Journey Not Found.'});
                
        return res.send({ messsage: 'Journey Found: ', journey});
    
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journey',err })
    }
}


exports.getJourneysAdmin = async (req, res) => {
    try 
    {
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
       
        return res.send({ message: 'Journey Found: ', journeys});
    } 
    catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Journeys' });
    }
}


exports.getMatchesAdmin = async (req, res) => 
{
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
            if(!tournamentExist)
            return res.status(400).send({ message: 'Matchs Not Founds.'})
            
        const journey = await Journey.findOne({ _id: data.journey }).populate('matches.localTeam matches.visitingTeam');
        const matches = journey.matches;

        if (!matches) 
            return res.send({ message: 'Matches Not Founds.' });
                  
        return res.send({ messsage: 'Matches Found:', matches });  
    } catch (err) 
    {
        console.log(err);
        return res.status(500).send({ message: 'Error getting Matches',err });
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
        
        const tournamentExist = await Tournament.findOne({ _id: data.tournament, journeys: data.journey });
        
        if (!tournamentExist) 
            return res.status(400).send({ message: 'No puedes eliminar partidos a esta jornada' })
           
        const journey = await Journey.findOne({ _id: data.journey });
        const match = await journey.matches.id(matchId);
        if (!match)
            return res.send({ message: 'Match Not Found' }); 
        
        //Busca el Equipo Local por ID y Usuario//|
        const localTeam = await Team.findOne
        ({_id: match.localTeam}).lean();
        if (!localTeam)
        return res.send({ message: 'Team Local not Found.'});

        //Busca el Equipo Visitante por ID y Usuario//
        const visitingTeam = await Team.findOne
        ({
            _id: match.visitingTeam,
        }).lean();
        if (!visitingTeam)
        return res.send({ message: 'Team Visiting not Found.' });

        //ACTUALIZAR LOS DATOS DE LOS EQUIPOS//

        //Control de Puntaje//
        //Actualizar los Datos de los Equipos//
        const dataTeams = await controlPoints(match);

        //Local//
        const updateDataLocalTeam = await Team.findOneAndUpdate(
        { _id: match.localTeam},
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
            { _id: match.visitingTeam},
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
                { $pull: { 'matches': { '_id': match._id} } },
                { new: true });
            
            if(!deleteMatch)
                return res.send({message: 'Match not Delete.'})

            return res.send({ message: 'Deleted Match Successfully ', deleteMatch });
            
    } catch (err) {
        console.log(err);
        return res.status(500).send({ message: 'Error deleting match',err});
    }
}