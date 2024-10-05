const repoQuery = require('../database/repoQuery');
const {validateRepoParams} = require('../utils/repoUtils');

const getAllRepos = async (req, res) => {

    try{
        const repos = await repoQuery.queryAllRepos();

        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const createRepo = async (req, res) => {

    try{
        const user_id = req.user;
        const validated_params = validateRepoParams(user_id, req.body);

        const repos = await repoQuery.queryAllRepos();
        const names = repos.map(data => data.name);
        
        if(names && names.includes(validated_params.name)){
            throw Error(`This User alreay has a repository named \"${validated_params.name}\".`);
        }

        const repo = await repoQuery.createRepo(validated_params);

        res.status(200).send(repo);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getReposByJWT = async (req, res) => {

    try{
        const user_id = req.user;
        const repos = await repoQuery.queryAllReposOfUser(user_id);

        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getAllRepos,
    createRepo,
    getReposByJWT
}