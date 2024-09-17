const express = require('express');
const passport = require('passport');

const router = express.Router();

router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'openid']
}));

router.get('/google/callback', passport.authenticate('google'), (req, res) => {
    res.status(200).send({"User Authorized": req.user});
})

module.exports = router;