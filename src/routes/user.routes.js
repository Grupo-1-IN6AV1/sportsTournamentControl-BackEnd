'use strict'

const express = require('express');
const userController = require('../controllers/user.controller');
const api = express.Router();
const mdAuth = require('../services/authenticated');

//FUNCIÓN PÚBLICA
api.get('/userTest', userController.userTest);

//FUNCIONES PRIVADAS//
//CLIENT//
api.post('/register', userController.register);
api.post('/login', userController.login);
api.put('/update/:id', mdAuth.ensureAuth, userController.update);
api.delete('/delete/:id', mdAuth.ensureAuth, userController.delete);

//FUNCIONES PRIVADAS//
//ADMIN//
api.post('/saveUser', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.saveUser);
api.put('/updateUser/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.updateUser);
api.delete('/deleteUser/:id', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.deleteUser);
api.get('/getUser/:id', mdAuth.ensureAuth, userController.getUser);
api.post('/searchUser', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.searchUser);
api.get('/getUsers', [mdAuth.ensureAuth, mdAuth.isAdmin], userController.getUsers);

module.exports = api;