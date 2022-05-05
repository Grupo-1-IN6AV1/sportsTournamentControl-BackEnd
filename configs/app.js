'use strict';


//Importación de las Dependencias
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require ('cors');
const userRoutes = require('../src/routes/user.routes');
const tournamentRoutes = require('../src/routes/tournament.routes');


//APP -> Servidor HTTP (Express)
const app = express(); //Creación del Servidor de Express


/*--------- CONFIGURACIÓN DEL SERVIDOR ---------*/ 

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

app.use('/user', userRoutes);
app.use('/tournament', tournamentRoutes);


//Exportación//
module.exports = app;