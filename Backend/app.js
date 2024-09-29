const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');
const {setup, query} = require('./database/psqlWrapper');

const app = express();

setup()
  .then(() => {
    app.listen(3000);
    console.log('Connected to PostgreSQL...')
  })
  .catch((err) => console.log('Error:', err));

app.use(express.json());

app.use( 
  session({ 
    resave: false, 
    saveUninitialized: false, 
    secret: process.env.SESSION_KEY, 
  }) 
);

app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());

app.use((req, res, next) => {
    console.log(`METHOD: ${req.method}, Path: ${req.path}`);
    next();
});

app.use('/nonAuth', (req, res) => {
  res.status(200).send("non Auth API works.");
})

app.use('/auth', authRoutes);

app.use(requireAuth);

app.use('/user', userRoutes);

app.use('/home', (req, res) => {
  res.status(200).send("Home Page for " + req.user.name);
})

app.use((req, res) => {
    res.status(400).send("Error 404!");
})