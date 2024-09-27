const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '3d' })
    
    res.cookie('jwtToken', token);
    res.status(200).send({user: req.user.name, jwt: token, googleVerified: req.user.google_id ? true : false});
})

module.exports = router;