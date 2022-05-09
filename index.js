'use strict';

//Importación del Archivo mongoConfig - Conexión a MongoDB
const mongoConfig = require('./configs/mongoConfig');

//Importación de Encriptado//
const {encrypt, alreadyUser} = require('./src/utils/validate');

//Importación del Modelo de Usuario//
const User = require('./src/models/user.model');

//Importación del Servidor de Express
const app = require('./configs/app');

//Importación del Puerto en una Constante
const port = 3200;

mongoConfig.init();

app.listen(port, async ()=>
{
    console.log(`Server HTTP running in port ${port}.`);

    const automaticUser = 
    {
        username: 'ADMIN',
        name: 'ADMIN',
        surname: 'ADMIN',
        phone: 'ADMIN',
        email: 'admin@kinal.edu.gt',
        password: await encrypt('deportes123'),
        role: 'ADMIN'
    }

    const searchUserAdmin = await alreadyUser(automaticUser.username);
    if(!searchUserAdmin)
    {
        let userAdmin = new User(automaticUser);
        await userAdmin.save();
        console.log('User Admin register Successfully.')
    }

});