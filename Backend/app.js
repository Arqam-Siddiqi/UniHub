const express = require('express');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');
const { setup } = require('./database/psqlWrapper');
const documentRoutes = require('./routes/documentRoutes');

const app = express();

const allowedOrigins = ['http://localhost:5713', 'http://localhost:3000', 'https://unihub-frontend.vercel.app'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true, // If you want to include cookies in the request
}));

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
});


app.use('/auth', authRoutes);
app.use('/user', userRoutes); // move this below requireAuth
app.use('/document', documentRoutes); // move this below requireAuth

app.use(requireAuth);


app.get('/', (req, res) => {
  res.status(200).send("Home Page for " + req.user.name);
})


app.use((req, res) => {
    res.status(400).send("Error 404!");
})