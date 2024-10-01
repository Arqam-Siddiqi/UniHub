const {query} = require('../database/psqlWrapper')

const getAllUsers = async (req, res) => {
    try{
        const users = await query('SELECT * FROM Users');
        
        res.status(200).send(users.rows);
    }   
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const createUser = async (req, res) => {

    try{
        const user = await query(
            'INSERT INTO Users (name) VALUES ($1) RETURNING *',
            [req.body.name]
        );

        res.send(user.rows[0]);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

// incomplete
const updateUserByEmail = async (req, res) => {

    try{
        const {email} = req.body;
        
        
        res.status(200).send();
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getAllUsers,
    createUser,
    updateUserByEmail
}