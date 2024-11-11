const express = require('express');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
const cors = require('cors');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const repoRoutes = require('./routes/repoRoutes');
const folderRoutes = require('./routes/folderRoutes');
const fileRoutes = require('./routes/fileRoutes');
const courseRoutes = require('./routes/coursesRoutes');
const commentRoutes = require('./routes/commentRoutes');

require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');
const { dbSetup } = require('./database/psqlWrapper');
const {initializeStorage} = require('./cloud_storage/cloud');
const app = express();

app.use(cors({
  origin: '*'
}));

dbSetup()
  .then(async () => {
    console.log('Connected to PostgreSQL...');
    await initializeStorage();
    app.listen(3000);
  })
  .catch((err) => console.log('Error:', err));

app.use
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

// Protected Endpoints
app.use('/user', userRoutes);
app.use('/repo', repoRoutes);
app.use('/folder', folderRoutes);
app.use('/file', fileRoutes);
app.use('/course', courseRoutes);
app.use('/comment', commentRoutes);


app.get('/', async (req, res) => {
  const userQuery = require('./database/userQuery');

  const user = await userQuery.queryUserByID(req.user);

  res.status(200).send("Home Page for " + user.name + '.');
})


app.use((req, res) => {
  res.status(400).send({"Error": "This API doesn't exist."});
})
