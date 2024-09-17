const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const credentials = require('./credentials.json');
const query = require('../database/psqlWrapper');

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser( (user, done) => {
  // console.log("here1");
  // const result = await query(`
  //   SELECT * FROM Users
  //   WHERE google_id = $1
  // `, [id]);
  done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: credentials.web.client_id,
    clientSecret: credentials.web.client_secret,
    callbackURL: "http://localhost:3000/auth/google/callback",
    passReqToCallback   : true
  },
  async function(request, accessToken, refreshToken, profile, done) {
    await query(`
      INSERT INTO Users (google_id, name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (google_id) DO NOTHING
    `, [profile.id, profile.displayName, profile.emails[0].value]);

    const result = await query(`
      SELECT * FROM Users
      WHERE google_id = $1  
    `, [profile.id])
    done(null, result.rows[0]);
  }
));

// function(request, accessToken, refreshToken, profile, done) {
//   User.findOrCreate({ googleId: profile.id }, function (err, user) {
//     return done(err, user);
//   });
// }