const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');

const app = express();

app.listen(3000);

app.use(express.json());

app.use( 
    session({ 
      resave: false, 
      saveUninitialized: false, 
      secret: process.env.cookieKey, 
    }) 
  );

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    console.log(`METHOD: ${req.method}, Path: ${req.path}`);
    next();
});


app.use('/auth', authRoutes);

app.use(requireAuth);

app.use('/user', userRoutes);

app.use((req, res) => {
    res.status(400).send("Error 404!");
})