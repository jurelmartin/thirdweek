const bcrypt = require('bcryptjs');
const validator = require('validator');

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
            const error = new Error('User exists already');
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

        const user = await User.findById(id);
        if(!user) {
            const error = new Error('User does not exist');
            error.code = 404;
            throw error;
        }

        const errors = [];
        if(validator.isEmpty(userInput.firstName) || validator.isEmpty(userInput.lastName) || validator.isEmpty(userInput.email || validator.isEmpty(userInput.password) )  ) {

        
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
                const error = new Error('User exists already');
                throw error; 
            }
        }
     
        user.firstName = userInput.firstName;
        user.lastName = userInput.lastName;
        user.email = userInput.email;
        user.password = hashedPassword;
        const updatedUser = await user.save();

        return { ...updatedUser._doc,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            email: updatedUser.email,
            password: updatedUser.password,
            permissionLevel: updatedUser.permissionLevel
        } 
    }
}

