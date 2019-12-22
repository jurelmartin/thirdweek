const bcrypt = require('bcryptjs');
const validator = require('validator');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const User = require('../models/user');


module.exports = {
    createUser: async function({ userInput }, request) {

        const errors = [];
        if (validator.isEmpty(userInput.firstName) || !validator.isLength(userInput.firstName, { min: 2 })) {
            errors.push({ message: 'Firstname must be atleast 2 characters...' });
        }
        if (validator.isEmpty(userInput.lastName) || !validator.isLength(userInput.lastName, { min: 2 })) {
            errors.push({ message: 'Lastname Must be atleast 2 characters...' });
        }
        if (!validator.isEmail(userInput.email)){
            errors.push({ message: 'Invalid email' });

        }
        if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 2 })) {
            errors.push({ message: 'Password too short' });
        }
        if (errors.length > 0) {
            const error = new Error('Invalid input...');
            error.data = errors;
            error.code = 422;
            throw error;
        }
        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) {
            const error = new Error('Email exists already');
            throw error; 
        }
        const permissionLevel = 2;
        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = new User({
            firstName: userInput.firstName,
            lastName: userInput.lastName,
            email: userInput.email,
            password: hashedPassword,
            permissionLevel: permissionLevel
        });
        const result = await user.save();
        return { ...result._doc, _id: result._id.toString() };
    },

    getUsers: async function(args, request) {
 
        const users = await User.find();
        return { users: users.map(users => {
            return {...users._doc,  
                _id: users._id.toString(),
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                password: users.password,
                permissionLevel: users.permissionLevel
            }
        })};

    },

    getUser: async function({ id }, request) {
        
        const qrySearch={"_id": new ObjectId(id)};
        const user = await User.findById(qrySearch);
        
        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }
        return { ...user._doc,
            _id: user._id.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: user.password,
            permissionLevel: user.permissionLevel
        }
    },

    updateUser: async function({ id, userInput }, request) {

        const errors = [];
        const qrySearch={"_id": new ObjectId(id)};
        const user = await User.findById(qrySearch);

        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }


        if (userInput.firstName !== undefined) {
            user.firstName = userInput.firstName;
            if (validator.isEmpty(userInput.firstName) || !validator.isLength(userInput.firstName, { min: 2 })) {
                errors.push({ message: 'Firstname must be atleast 2 characters...' });
            }
        }

        if (userInput.lastName !== undefined) {
            user.lastName = userInput.lastName;
            if (validator.isEmpty(userInput.lastName) || !validator.isLength(userInput.lastName, { min: 2 })) {
                errors.push({ message: 'Lastname Must be atleast 2 characters...' });
            }
        }

        if (userInput.email !== undefined) {
            user.email = userInput.email;
            if (!validator.isEmail(userInput.email)){
                errors.push({ message: 'Invalid email' });
    
            }
        }

        if (userInput.password !== undefined) {
            user.password = userInput.password;
            if (validator.isEmpty(userInput.password) || !validator.isLength(userInput.password, { min: 2 })) {
                errors.push({ message: 'Password too short' });
            }
        }
        const hashedPassword = await bcrypt.hash(userInput.password, 12);

 

        const updatedUser = await user.save();
        return { ...updatedUser._doc,
                _id: updatedUser._id.toString(),
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                password: hashedPassword,
                permissionLevel: updatedUser.permissionLevel  }



    }
}

