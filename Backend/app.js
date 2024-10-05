const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');
const { setup } = require('./database/psqlWrapper');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

app.use(cors({ origin: [process.env.FRONTEND, 'http://localhost:5173', 'http://localhost:3000'] }));

setup()
  .then(() => {
    app.listen(3000);
    console.log('Connected to PostgreSQL...');
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


app.use((req, res, next) => {
    console.log(`METHOD: ${req.method}, Path: ${req.path}`);
    next();
});


app.use('/nonAuth', (req, res) => {
  res.status(200).send("non Auth API works.");
});


app.use('/auth', authRoutes);

app.use(requireAuth);

app.use('/user', userRoutes);
app.use('/document', documentRoutes);


app.get('/', async (req, res) => {
  const userQuery = require('./database/userQuery');

  const user = await userQuery.queryUserByID(req.user);

  res.status(200).send("Home Page for " + user.name + '.');
})


app.use((req, res) => {
    res.status(400).send("Error 404!");
})