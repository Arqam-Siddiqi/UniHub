const express = require('express');

const userRoutes = require('./routes/userRoutes');
const query = require('./database/psqlWrapper');

const app = express();

app.listen(3000);

app.use(express.json());

app.use((req, res, next) => {
    console.log(`METHOD: ${req.method}, Path: ${req.path}`);
    next();
});

app.get('/', async (req, res) => {
    try{
        const users = await query('SELECT * FROM Users');
        
        res.status(200).send(users.rows);
    }   
    catch(error){
        res.status(400).send(error.message);
    }
});

app.post('/create', async (req, res) => {

    try{
        const user = await query(
            'INSERT INTO Users (name) VALUES ($1) RETURNING *',
            [req.body.name]
        );

        res.send(user.rows[0]);
    }
    catch(error){
        res.send(error.message);
    }

});

app.use('/user', userRoutes);

app.use((req, res) => {
    res.status(400).send("Error 404");
})