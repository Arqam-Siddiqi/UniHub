const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const authController = require('../controllers/authController');
const {createJWT} = require('../utils/userUtils');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), authController.googleSignIn);

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/logout', authController.logout);

module.exports = router;