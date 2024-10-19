const express = require('express');
const passport = require('passport');

const authController = require('../controllers/authController');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: [
        'profile', 
        'email', 
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.me.readonly'
    ],
    accessType: 'offline'
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND}/home` }), authController.googleSignIn);

router.post('/signup', authController.signup);

router.post('/login', authController.login);


module.exports = router;