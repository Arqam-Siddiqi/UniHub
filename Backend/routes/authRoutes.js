const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const authController = require('../controllers/authController');
const {createJWT} = require('../utils/userUtils');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    
    const token = createJWT(req.user.id);
    
    res.cookie('jwtToken', token);
    res.status(200).send({user: req.user.name, jwt: token, googleVerified: req.user.google_id ? true : false});
});

router.post('/signup', authController.signup);

router.post('/login', authController.login);

module.exports = router;