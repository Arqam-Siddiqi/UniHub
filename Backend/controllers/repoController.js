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
        const validated_params = validateRepoParams(user_id, req.body, 'c');

        const repos = await repoQuery.queryAllReposOfUser(user_id);
        const names = repos.map(data => data.name);
        
        if(names && names.includes(validated_params.name)){
            throw Error(`This User alreay has a repository named \"${validated_params.name}\".`);
        }

        const repo = await repoQuery.createRepo(user_id,validated_params);

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

const updateRepo =async (req, res)=>{
    try {
        const user_id = req.user;
        const validated_params = validateRepoParams(user_id, req.body, 'u');
        const repo = await repoQuery.queryAllReposOfUser(user_id);
        const ids = repo.map(data => data.id);
        const names = repo.map(data=>data.name);
        const currName= await repoQuery.queryRepoNameOfUser( req.body.id);
        
        if(!ids.includes(req.body.id)){
            throw Error(`This user does not have a Repository with id  "${req.body.id}".`);
        }

        if(currName[0].name !== req.body.name){
            if(names.includes(req.body.name) ){
                throw Error(`There is already a repo named "${req.body.name}".`)
            }
        }
       
        const repos= await repoQuery.updateRepoOfUser(validated_params);
       
        res.status(200).send(repos);
    } catch (error) {
        res.status(400).send({"Error": error.message});
    }
}

const deleteRepo = async (req, res)=>{
    try {
        
        const user_id=req.user;
        
        const repos = await repoQuery.queryAllReposOfUser(user_id);
        const ids = repos.map(data => data.id);

        const validated_params = validateRepoParams(user_id,req.body, 'd');

        if(!ids.includes(req.body.id)){
            throw Error(`This user does not have a Repository with id "${req.body.id}".`);
        }
        
        const repo = await repoQuery.deleteRepoOfUser(validated_params);
        res.status(200).send(repo);
    } catch (error) {
        res.status(400).send({"Error": error.message});
    }
}

module.exports = {
    getAllRepos,
    createRepo,
    getReposByJWT,
    updateRepo,
    deleteRepo
}