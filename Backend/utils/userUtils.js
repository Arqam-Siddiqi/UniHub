const validator = require('validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const {query} = require('../database/psqlWrapper');

const createJWT = (payload) => {
    return jwt.sign({id: payload}, process.env.JWT_SECRET, {expiresIn: '3d'});
}

// always call with await
const validateUserParams = async ({name, password, email}) => {

    if(!name || !password || !email){
        throw Error("Fill in all the required fields.");
    }

    if(name.split(' ').length > 1){
        throw Error("Name should be one continuous word.");
    }

    if(email.split(' ').length > 1){
        throw Error("Password should be one continuous word");
    }

    if(!validator.isStrongPassword(password)){
        throw Error("Password should have atleast 8 characters, 1 lower-case character, 1 upper-case character, 1 symbol, and 1 number.");
    }

    if(!validator.isEmail(email)){
        throw Error("Invalid email.");
    }

    const exists = (await query(`
        SELECT email FROM Users
        WHERE email = $1
    `, [email])).rows[0]

    if(exists){
        throw Error("User with this email already exists.");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    return {
        name,
        password: hash,
        email
    }

}

module.exports = {
    validateUserParams,
    createJWT
}