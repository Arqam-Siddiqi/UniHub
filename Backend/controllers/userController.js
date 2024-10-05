const userQuery = require('../database/userQuery');
const uuid = require('uuid');

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

        const user = await userQuery.updateUserByID(id, req.body);

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
    getUserByID
}