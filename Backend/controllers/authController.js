const bcrypt = require('bcrypt');
const {google} = require('googleapis');

const authQuery = require('../database/authQuery');
const userQuery = require('../database/userQuery');
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
        
        const user = await authQuery.createLocalUser(name, password, email);

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

        const user = await userQuery.queryUserByEmail(email);
        
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