const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userQuery = require('../database/userQuery');
const authQuery = require('../database/authQuery');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.HOSTING_SITE ? `${process.env.HOSTING_SITE}/auth/google/callback` : `http://localhost:${process.env.BACKEND_PORT}/auth/google/callback`,
  },
  async function(access_token, refresh_token, profile, done) {
    
    try{
      let user = await userQuery.queryUserByEmail(profile.emails[0].value);

      if(user){
        await authQuery.updateGoogleTokens(user.google_id, access_token, refresh_token);
        console.log('Updated tokens');
      } 
      else {
        user = await authQuery.createGoogleUser(profile, access_token, refresh_token);
      }
      
      done(null, {...user, access_token, refresh_token});
    }
    catch(error){
      console.log("Unable to create user.", error.message);
    }
    
  }
));