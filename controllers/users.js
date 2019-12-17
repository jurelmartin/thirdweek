
const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jsonwt = require('jsonwebtoken');

const User = require('../models/user');

exports.createUser = async (request, response, next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const email = request.body.email;
    const password = request.body.password;
    const permissionLevel = request.body.permissionLevel;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            permissionLevel: permissionLevel
        });
        const result = await user.save();
        response.status(201).json(result)
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getUsers = async (request, response, next) => {
    try {
        const users = await User.find();
        response.status(200).json(users);
    }
    catch (err){
        if (!err.statusCode) {
            err.statusCode = 500;
          }
    }
};

exports.getUser = async (request, response, next) => {
    const userId = request.params.userId;
    const user = await User.findById(userId);
    try {
        if (!user) {
            const error = new Error('Could not find user...');
            error.statusCode = 404;
            throw error;
        }
        response.status(200).json(user);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
};


exports.patchUser = async (request, response, next) => {
    const userId = request.params.userId;
    const newUserData = request.body;
    const user = await User.findById(userId);

    if(request.body.password){
        const hashedPassword = await bcrypt.hash(request.body.password, 12);
        request.body.password = hashedPassword;
    }

    try {
        const result = await user.update({$set: newUserData});
        response.status(200).json(result);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
};

exports.deleteUser = async (request, response, next) => {
    const userId = request.params.userId;
    const user = await User.findById(userId);

    try {
        const result = await user.remove({_id: userId});
        response.status(200).json(result);
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }
          next(err);
    }
};

