const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const credentials = require('./credentials.json');
const userQuery = require('../database/userQuery');
const authQuery = require('../database/authQuery');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    callbackURL: process.env.HOSTING_SITE ? `${process.env.HOSTING_SITE}/auth/google/callback` : `http://localhost:${process.env.BACKEND_PORT}/auth/google/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    
    try{
      let user = await authQuery.createGoogleUser(profile);
      
      // if user already has an account
      if(!user){
        result = await userQuery.queryUserByEmail(profile.emails[0].value);
      }
      
      done(null, result);
    }
    catch(error){
      console.log("Unable to create user.");
    }
    
  }
));