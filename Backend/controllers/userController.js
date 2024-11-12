const userQuery = require('../database/userQuery');
const uuid = require('uuid');
const { validateUserParamsForPatch } = require('../utils/userUtils');
const bcrypt = require('bcrypt');

const getAllUsers = async (req, res) => {
    
    try{
        const users = await userQuery.queryAllUsers();
        
        res.status(200).send(users);
    }   
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const getUserByJWT = async (req, res) => {

    try{
        const id = req.user;

        const user = await userQuery.queryUserByID(id);
        res.status(200).send(user);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const updateUserByJWT = async (req, res) => {

    try{
        const id = req.user;

        const validated_params = validateUserParamsForPatch(req.body);

        const {existing_password, password} = validated_params;

        if(existing_password){
            const exists = await userQuery.queryUserByID(id);
            const check = await bcrypt.compare(existing_password, exists.password);

            if(!password){
                throw Error("New Password field is empty.");
            }
            else if(!check){
                throw Error("The existing password is incorrect.");
            }
    
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            validated_params.password = hash;
        }
        else{
            if(password){
                throw Error("Submit the existing password as well.");
            }
        }

        const user = await userQuery.updateUserByID(id, validated_params);

        res.status(200).send(user);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const deleteUserByJWT = async (req, res) => {

    try{
        const id = req.user;

        const user = await userQuery.deleteUserByID(id);

        res.status(200).send(user);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getUserByID = async (req, res) => {

    try{
        const {id} = req.params;

        if(!uuid.validate(id)){
            throw Error("Invalid User ID.");
        }

        const user = await userQuery.queryUserByID(id);
        res.status(200).send(user);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getAllUsers,
    getUserByJWT,
    updateUserByJWT,
    deleteUserByJWT,
    getUserByID
}