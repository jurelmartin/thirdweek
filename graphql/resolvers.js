const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
// const { validator, validate } = require('graphql-validation');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const User = require('../models/user');

let tokenRecords = {};

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
        if(!request.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
 
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
        if(!request.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }
        
        const qrySearch={"_id": new ObjectId(id)};
        const user = await User.findById(id);
        
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

        const qrySearch={"_id": new ObjectId(id)};
        const user = await User.findById(qrySearch);

        let defaultPassword = await user.password;
        // console.log(defaultPassword);
        const errors = [];


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
        


        if (errors.length > 0) {
            const error = new Error('Invalid input...');
            error.data = errors;
            error.code = 422;
            throw error;
        }

        
        if (userInput.password) {
            const hashedPassword = await bcrypt.hash(userInput.password, 12);
            defaultPassword = await hashedPassword;

        }
        user.password = defaultPassword;

        const updatedUser = await user.save();

        return { ...updatedUser._doc,
                _id: updatedUser._id.toString(),
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                password: updatedUser.password,
                permissionLevel: updatedUser.permissionLevel  }
    },

    deleteUser: async function ({ id }, request) {

        if(!request.isAuth) {
            const error = new Error('Not authenticated!');
            error.code = 401;
            throw error;
        }

        const qrySearch={"_id": new ObjectId(id)};
        const user = await User.findById(qrySearch);

     
        console.log(user);
        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }

        await User.findByIdAndRemove(id);
        return { message: 'User deleted!', status: 200 }
    },

    isMatch: async function ({ email, password }) {
        const user = await User.findOne({ email: email });
        let activeUser;

        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }
        activeUser = user;

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error('Password is incorrect.');
            error.code = 401;
            throw error;
        }
        const token = jwt.sign({
            email: activeUser.email,
            userId: activeUser._id.toString(),
            permissionLevel: activeUser.permissionLevel
        }, 'mysecretprivatekey', { expiresIn: '1hr' });

        const refreshToken = jwt.sign({
            email: activeUser.email,
            userId: activeUser._id.toString(),
            permissionLevel: activeUser.permissionLevel
        }, 'mysecretprivaterefreshkey', { expiresIn: '24hr' });


        const myTokens = {
            "token": token,
            "refreshToken": refreshToken
        }
        tokenRecords[refreshToken] = myTokens;
        return { token: myTokens.token, refreshToken: myTokens.refreshToken }
    },

    getNewToken: async function ({ email, refreshToken }) {
        const user = await User.findOne({ email: email });
        let activeUser;

        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }
        activeUser = user;

        if((refreshToken) && (refreshToken in tokenRecords)) {
            const token =  jwt.sign({
                email: activeUser.email,
                userId: activeUser._id.toString(),
                permissionLevel: activeUser.permissionLevel
            },
            'mysecretprivatekey', { expiresIn: '1h' });

            
            const changeResponse = {
                "token": token
            }
            console.log(token);
            tokenRecords[refreshToken].token = token;

            console.log(tokenRecords[refreshToken].token);
            return { token: changeResponse.token}

        }
        else {
            const error = new Error('Invalid token!');
            error.code = 500;
            throw error;
        }

                
        
    }
}

