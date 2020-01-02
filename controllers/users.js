
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jsonwt = require('jsonwebtoken');



const User = require('../models/user');

exports.createUser = async (request, response, next) => {
    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        return response.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }
    const firstName = request.body.firstName;
    const lastName = request.body.lastName;
    const email = request.body.email;
    const password = request.body.password;
    request.body.permissionLevel = 2;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: hashedPassword,
            permissionLevel: request.body.permissionLevel
        });
        const result = await user.save();
        response.status(201).json({ userId: result._id });
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
    const userId = await request.params.userId;
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

    const errors = validationResult(request);
    if(!errors.isEmpty()) {
        return response.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }
    const userId = await request.userId;
    const newUserData = request.body;
    const user = await User.findById(request.params.userId);

    if(request.body.password){
        const hashedPassword = await bcrypt.hash(request.body.password, 12);
        request.body.password = hashedPassword;
    }

    try {
        if (!user) {
            return response.status(401).json({ message: 'Could not find user...' });
        }
        else {
            let obj = Object(newUserData);
            if("permissionLevel" in obj) {
                if(request.permissionLevel === 1 ) {
                const result = await user.update({$set: newUserData});
                return response.status(200).json({ message: 'Updated successfully!' });
                }
                else {
                    return response.status(401).json({ message: 'Not permitted!!' });
                }
            }

            if(userId === request.params.userId) {
                const result = await user.update({$set: newUserData});
                return response.status(200).json({ message: 'Updated successfully!' });
            }

            if((userId !== request.params.userId) && (request.permissionLevel === 1)) {
                const result = await user.update({$set: newUserData});
                return response.status(200).json({ message: 'Updated successfully!' });
            }
            else {
                return response.status(401).json({ message: 'Not allowed to change!!!' });
            }
        }
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

    try {
        const user = await User.findById(userId);
        if (!user) {
            return response.status(401).json({ message: 'Could not find user...' });
        }
        if(request.permissionLevel === 1) {
            const result = await user.remove({_id: userId});
            return response.status(200).json({ message: 'User Deleted!' });
        }
        else {
            return response.status(401).json({ message: 'Not Authorized!!' });
        }
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
          }

          next(err);
    }
};
