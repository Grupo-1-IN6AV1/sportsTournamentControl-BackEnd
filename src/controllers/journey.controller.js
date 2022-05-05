'use strict'

const Journey = require('../models/journey.model');

//F U N C I O N E S     P Ú B L I C A S//

/Función de Testeo/
exports.testJourney = (req, res) =>
{
    return res.send({message: 'Journey test is running.'});
}