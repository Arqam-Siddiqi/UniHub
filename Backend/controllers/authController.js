const bcrypt = require('bcrypt');

const {query} = require('../database/psqlWrapper');
const {validateUserParams, createJWT} = require('../utils/userUtils');

const googleSignIn = async (req, res) => {

    try{
        const token = createJWT(req.user.id);

        const params = new URLSearchParams({
            name: req.user.name,
            jwt: token,
            googleVerified: true
        }).toString();

        res.redirect(`${process.env.FRONTEND}/user-page?${params}`);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const signup = async (req, res) => {

    try{
        const {name, password, email} = await validateUserParams(req.body);
        
        const user = (await query(`
            INSERT INTO Users(name, password, email)
            VALUES ($1, $2, $3)
            RETURNING *; 
        `, [name, password, email])).rows[0];

        const token = createJWT(user.id);

        res.status(200).send({name: user.name, jwt: token, googleVerified: false});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const login = async (req, res) => {

    try{
        const {email, password} = req.body;

        const user = (await query(`
            SELECT * FROM Users
            WHERE email = $1;  
        `, [email])).rows[0];
        
        
        if(!user || !user.password){
            throw Error("Invalid credentials.");
        }

        const match = await bcrypt.compare(password, user.password);

        if(!match){
            throw Error("Invalid credentials");
        }

        const token = createJWT(user.id);

        res.status(200).send({name: user.name, jwt: token, googleVerified: false});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    signup,
    login,
    googleSignIn
}