'use strict';


//Importación de las Dependencias
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require ('cors');


//APP -> Servidor HTTP (Express)
const app = express(); //Creación del Servidor de Express


/*--------- CONFIGURACIÓN DEL SERVIDOR ---------*/ 

app.use(helmet());
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());


//Exportación//
module.exports = app;