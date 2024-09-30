const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const authController = require('../controllers/authController');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'https://uni-hub-frontend.vercel.app/home' }), authController.googleSignIn);

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

module.exports = router;