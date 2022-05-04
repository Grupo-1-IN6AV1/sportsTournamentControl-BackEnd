'use strict';

//Importación del Archivo mongoConfig - Conexión a MongoDB
const mongoConfig = require('./configs/mongoConfig');

//Importación del Servidor de Express
const app = require('./configs/app');

//Importación del Puerto en una Constante
const port = 3200;

mongoConfig.init();

app.listen(port, ()=>
{
    console.log(`Server HTTP running in port ${port}.`);
});