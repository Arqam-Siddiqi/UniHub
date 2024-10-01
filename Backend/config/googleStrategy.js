const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const credentials = require('./credentials.json');
const {query} = require('../database/psqlWrapper');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  done(null, user);
});

console.log(process.env.HOSTING_SITE ? `${process.env.HOSTING_SITE}/auth/google/callback` : `http://localhost:${process.env.BACKEND_PORT}/auth/google/callback`);
passport.use(new GoogleStrategy({
    clientID: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    callbackURL: process.env.HOSTING_SITE ? `${process.env.HOSTING_SITE}/auth/google/callback` : `http://localhost:${process.env.BACKEND_PORT}/auth/google/callback`,
    passReqToCallback: true
  },
  async function(req, accessToken, refreshToken, profile, done) {
    
    try{
      let result = await query(`
        INSERT INTO Users (google_id, name, email)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) DO NOTHING
        RETURNING *;
      `, [profile.id, profile.displayName, profile.emails[0].value]);
      
      if(result.rows.length == 0){
        result = await query(`
          SELECT * FROM Users
          WHERE email = ($1);
        `, [profile.emails[0].value])
      };
  
      done(null, result.rows[0]);
    }
    catch(error){
      console.log("Unable to create user.");
    }
    
  }
));