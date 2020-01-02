const express = require('express');
const usersController = require('../controllers/users');
const authValid = require('../middleware/authValidation');
const authPermission = require('../middleware/authPermission');
const { body } = require('express-validator');

const router = express.Router();
const User = require('../models/user');

//const tcRoutes = require('../middleware/tokenChecker');


// router.use(tcRoutes);

// MY ROUTES 
router.post('/users', [
    body('firstName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Must be atleast 2 characters...'),
    body('lastName')
        .trim()
        .isLength({ min: 2 })
        .withMessage('Must be atleast 2 characters...'),
    body('email')
        .isEmail()
        .withMessage('Email not valid...')
        .custom((value, { request }) => {
            return User.findOne({ email: value }).then(userDocument => {
                if (userDocument) {
                    return Promise.reject('Email already exists!');
                }
            });
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Must be atleast 5 characters...'),
], usersController.createUser);

router.get('/users', authValid, authPermission.adminPermission, usersController.getUsers);

router.get('/users/:userId', authPermission.adminPermission, usersController.getUser);

router.patch('/users/:userId', [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Must be atleast 2 characters...'),
    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2 })
        .withMessage('Must be atleast 2 characters...'),
    body('email')
        .optional()
        .isEmail()
        .withMessage('Invalid email')
        .custom((value, { request }) => {
            return User.findOne({ email: value }).then(userDocument => {
                if (userDocument) {
                    return Promise.reject('Email already exists!');
                }
            });
        })
        .normalizeEmail(),
    body('password')
        .optional()
        .trim()
        .isLength({ min: 5 }) 
        .withMessage('Must be atleast 5 characters...'),
], authValid, authPermission.userAndAdminPermission, usersController.patchUser);

router.delete('/users/:userId',authValid, authPermission.adminPermission, usersController.deleteUser);


module.exports = router;