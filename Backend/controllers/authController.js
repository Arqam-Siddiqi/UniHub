const bcrypt = require('bcrypt');

const {query} = require('../database/psqlWrapper');
const {validateUserParams, createJWT} = require('../utils/userUtils');

const googleSignIn = async (req, res) => {

    try{
        const token = createJWT(req.user.id);
        
        res.cookie(
            'user', 
            {name: req.user.name, jwt: token, googleVerified: req.user.google_id ? true : false}, 
            { httpOnly: true, secure: true, maxAge: 1 * 60 * 60 * 1000 }
        );

        res.redirect(process.env.SUCCESS_REDIRECT);
        res.status(200).send({user: req.user.name, jwt: token, googleVerified: req.user.google_id ? true : false});
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

        res.cookie(
            'user', 
            {name: user.name, jwt: token, googleVerified: false}, 
            { httpOnly: true, secure: true, maxAge: 1 * 60 * 60 * 1000 }
        );

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

        res.cookie(
            'user', 
            {name: user.name, jwt: token, googleVerified: false}, 
            { httpOnly: true, secure: true, maxAge: 1 * 60 * 60 * 1000 }
        );

        res.redirect('https://uni-hub-frontend.vercel.app/home');
        res.status(200).send({name: user.name, jwt: token, googleVerified: false});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const logout = async (req, res) => {

    try{
        res.clearCookie('user', { httpOnly: true, secure: true });
        res.status(200).send({"Message": "Logout successful."});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

module.exports = {
    signup,
    login,
    logout,
    googleSignIn
}