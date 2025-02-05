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
const courseRoutes = require('./routes/courseRoutes');
const commentRoutes = require('./routes/commentRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const mapRoutes = require('./routes/mapRoutes');

require('./config/googleStrategy');
const requireAuth = require('./middleware/requireAuth');
const { dbSetup } = require('./database/psqlWrapper');
const { authorize } = require('./cloud_storage/drive');
const {insertAllFaculty, insertAllRooms} = require('./indexing/algolia');

const app = express();

app.use(cors({
  origin: '*'
}));

dbSetup()
  .then(async () => {
    console.log(`Connected to PostgreSQL on ${process.env.HOSTING_SITE ? "Supabase" : "PGAdmin"}...`);
    await authorize();
    await insertAllFaculty();
    await insertAllRooms();

    console.log("App Launched.");
    app.listen(3000);
  })
  .catch((err) => {
      console.log('Error:', err);
  });

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


app.get('/', (req, res) => {
  res.status(200).send({"Root": "Server launched successfully."});
});


app.use('/auth', authRoutes);
app.use('/map', mapRoutes);

app.use('/repo', repoRoutes);
app.use('/user', userRoutes);

app.use('/folder', folderRoutes);
app.use('/file', fileRoutes);

app.use('/comment', commentRoutes);

app.use(requireAuth);

// Protected Endpoints
app.use('/course', courseRoutes);
app.use('/gemini', geminiRoutes);


app.get('/', async (req, res) => {
  const userQuery = require('./database/userQuery');

  const user = await userQuery.queryUserByID(req.user);

  res.status(200).send({"Message": `Home Page for ${user.name}.`});
})


app.use((req, res) => {
  res.status(400).send({"Error": "This API doesn't exist."});
})
