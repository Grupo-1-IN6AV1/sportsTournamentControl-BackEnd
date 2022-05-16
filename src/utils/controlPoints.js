'use strict'

const User = require('../models/user.model');
const Journey= require('../models/journey.model');
const Team = require('../models/team.model');

exports.controlPoints = (dataMatches) => 
{
    try
    {
        //CONTROL DEL PUNTAJE DE AMBOS EQUIPOS//
        var calculatePoints =
        {
            teamPointsLocal: 0,
            wonMatchesLocal: 0,
            lostMatchesLocal: 0,
            tiedMatchesLocal: 0,
            differenceGoalsLocal: 0,
            teamPointsVisiting: 0,
            wonMatchesVisiting: 0,
            lostMatchesVisiting: 0,
            tiedMatchesVisiting: 0,
            differenceGoalsLocal: 0,
            differenceGoalsVisiting: 0
        }
        if (dataMatches.localScore > dataMatches.visitingScore) {
            calculatePoints.teamPointsLocal = 3;
            calculatePoints.wonMatchesLocal = 1;
            calculatePoints.lostMatchesLocal = 0;
            calculatePoints.tiedMatchesLocal = 0;
            calculatePoints.teamPointsVisiting = 0;
            calculatePoints.wonMatchesVisiting = 0;
            calculatePoints.lostMatchesVisiting = 1;
            calculatePoints.tiedMatchesVisiting = 0;
            calculatePoints.differenceGoalsLocal = parseInt(dataMatches.localScore) - parseInt(dataMatches.visitingScore);
            calculatePoints.differenceGoalsVisiting = -parseInt(dataMatches.localScore) + parseInt(dataMatches.visitingScore)

        }
        if (dataMatches.visitingScore > dataMatches.localScore) {
            calculatePoints.teamPointsLocal = 0;
            calculatePoints.wonMatchesLocal = 0;
            calculatePoints.lostMatchesLocal = 1;
            calculatePoints.tiedMatchesLocal = 0;
            calculatePoints.teamPointsVisiting = 3;
            calculatePoints.wonMatchesVisiting = 1;
            calculatePoints.lostMatchesVisiting = 0;
            calculatePoints.tiedMatchesVisiting = 0;
            calculatePoints.differenceGoalsLocal = -parseInt(dataMatches.visitingScore) + parseInt(dataMatches.localScore);
            calculatePoints.differenceGoalsVisiting = +parseInt(dataMatches.visitingScore) - parseInt(dataMatches.localScore);
        }
        if (dataMatches.visitingScore == dataMatches.localScore) {
            calculatePoints.teamPointsLocal = 1;
            calculatePoints.wonMatchesLocal = 0;
            calculatePoints.lostMatchesLocal = 0;
            calculatePoints.tiedMatchesLocal = 1;
            calculatePoints.teamPointsVisiting = 1;
            calculatePoints.wonMatchesVisiting = 0;
            calculatePoints.lostMatchesVisiting = 0;
            calculatePoints.tiedMatchesVisiting = 1;
            calculatePoints.differenceGoals = 0
        }
        if(calculatePoints.teamPointsLocal<=0)
            calculatePoints.teamPointsLocal = 0
        if(calculatePoints.teamPointsVisiting<=0)
            calculatePoints.teamPointsVisiting = 0
        if(calculatePoints.wonMatchesLocal<=0)
            calculatePoints.wonMatchesLocal=0 
        if(calculatePoints.wonMatchesVisiting<=0)
            calculatePoints.wonMatchesVisiting=0
        if(calculatePoints.tiedMatchesLocal<=0)
            calculatePoints.tiedMatchesLocal=0
        if(calculatePoints.tiedMatchesVisiting<=0)
            calculatePoints.tiedMatchesVisiting=0
        if(calculatePoints.lostMatchesLocal<=0)
            calculatePoints.lostMatchesLocal=0
        if(calculatePoints.lostMatchesVisiting<=0)
            calculatePoints.lostMatchesVisiting=0
         
        
        const controlPoints = 
        {
            teamPointsLocal: calculatePoints.teamPointsLocal,
            wonMatchesLocal: calculatePoints.wonMatchesLocal,
            lostMatchesLocal: calculatePoints.lostMatchesLocal,
            tiedMatchesLocal: calculatePoints.tiedMatchesLocal,
            teamPointsVisiting: calculatePoints.teamPointsVisiting,
            wonMatchesVisiting: calculatePoints.wonMatchesVisiting,
            lostMatchesVisiting: calculatePoints.lostMatchesVisiting,
            tiedMatchesVisiting: calculatePoints.tiedMatchesVisiting,
            differenceGoalsLocal: calculatePoints.differenceGoalsLocal,
            differenceGoalsVisiting: calculatePoints.differenceGoalsVisiting,
        };
        return controlPoints;

    }
    catch(err)
    {
        return err;
    }
}
