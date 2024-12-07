const repoQuery = require('../database/repoQuery');
const uuid = require('uuid');
const {validateRepoParams} = require('../utils/repoUtils');
const algolia = require('../indexing/algolia');

const getAllPublicRepos = async (req, res) => {

    try{
        const user_id = req.user;
        const repos = await repoQuery.queryAllRepos(user_id);
    
        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const createRepo = async (req, res, next) => {

    try{
        const user_id = req.user;
        const validated_params = validateRepoParams(user_id, req.body, 'c');

        const repos = await repoQuery.queryAllReposOfUser(user_id);
        const names = repos.map(data => data.name);
        
        if(names && names.includes(validated_params.name)){
            throw Error(`This User already has a repository named \"${validated_params.name}\".`);
        }

        const repo = await repoQuery.createRepo(user_id, validated_params);
        const user = await repoQuery.getUserFromRepo(repo.id);

        repo.likes = 0;
        repo.num_of_comments = 0;
        repo.liked = false;
        repo.user_name = user.user_name;

        try {
            if(process.env.HOSTING_SITE && repo.visibility == 'public')
                await algolia.createOrUpdateRepo(repo);
        }
        catch(error) {
            await repoQuery.deleteRepoOfUser(repo);
            throw Error("Unable to add repository to Algolia.");
        }

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
        const repos = await repoQuery.queryAllReposOfUser(user_id);
        const ids = repos.map(data => data.id);
        const names = repos.map(data=>data.name);
        const currName= await repoQuery.queryRepoNameOfUser(req.body.id);
        
        if(!ids.includes(req.body.id)){
            throw Error(`This user does not have a Repository with id  "${req.body.id}".`);
        }

        if(currName[0].name !== req.body.name){
            if(names.includes(req.body.name) ){
                throw Error(`There is already a repo named "${req.body.name}".`)
            }
        }
       
        const old_repo = await repoQuery.queryReposByID(user_id, req.body.id);
        const new_repo = await repoQuery.updateRepoOfUser(validated_params);
        const user = await repoQuery.getUserFromRepo(new_repo.id);

        const formatted_new_repo = await repoQuery.queryReposByID(user_id, new_repo.id);
        formatted_new_repo.user_name = user.user_name;

        if(process.env.HOSTING_SITE){
            if(formatted_new_repo.visibility === 'public'){
                await algolia.createOrUpdateRepo(formatted_new_repo);
            }
            else if(formatted_new_repo.visibility === 'private' && old_repo.visibility === 'public'){
                await algolia.deleteRepo(formatted_new_repo.id);
            }
        }
       
        res.status(200).send(formatted_new_repo);
    } catch (error) {
        res.status(400).send({"Error": error.message});
    }
}

const deleteRepo = async (req, res, next)=>{
    try {
        const user_id=req.user;
        
        const repos = await repoQuery.queryAllReposOfUser(user_id);
        const ids = repos.map(data => data.id);

        const validated_params = validateRepoParams(user_id, req.body, 'd');

        if(!ids.includes(req.body.id)){
            throw Error(`This user does not have a Repository with id "${req.body.id}".`);
        }
        
        if(process.env.HOSTING_SITE)
            await algolia.deleteRepo(validated_params.id);

        let repo;
        try{   
            repo = await repoQuery.deleteRepoOfUser(validated_params);
        }
        catch(error){
            repo = await repoQuery.queryReposByID(validated_params.id);

            if(process.env.HOSTING_SITE)
                await algolia.createRepoOrUpdate(repo);
            
            throw Error(error.message);
        }

        res.status(200).send(repo);
    } catch (error) {
        res.status(400).send({"Error": error.message});
    }
}

const getRepoByID = async (req, res) => {

    try{
        const id = req.params?.id;
        const user_id = req.user;

        if(!id){
            throw Error("Please send the Repo ID.");
        }
        else if(!uuid.validate(id)){
            throw Error("This is not a valid UUID.");
        }

        const repo = await repoQuery.queryReposByID(user_id, id);
        
        res.status(200).send(repo);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const toggleLikeRepo = async (req, res) => {

    try{
        const user_id = req.user;

        const repo_id = req.body.id;
        if(!repo_id){
            throw Error("Please send the repo_id.");
        }

        const repo = await repoQuery.toggleLike(user_id, repo_id);

        res.status(200).send(repo);
    }
    catch(error){
        res.status(400).send(error.message);
    }

}

const searchMatch = async (req, res) => {

    try{
        const {search} = req.body;

        if(typeof search === 'undefined'){
            throw Error("Please send the search property.");
        }

        let repos;
        if(!search){
            repos = await repoQuery.queryAllRepos('likes');
        }
        else {  
            repos = await repoQuery.searchTitleAndTags(search);
        }   

        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getAllAlgoliaRepos = async (req, res) => {

    try{
        const {search} = req.body;
        const repos = await algolia.getAllPublicRepos(search);
    
        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getPublicReposOfUser = async (req, res) => {

    try {
        const {user_id} = req.body;
        if(!user_id){
            throw Error("Please fill all the required fields.");
        }

        const repos = await repoQuery.queryAllPublicReposOfUser(user_id);

        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getPopularRepos = async (req, res) => {

    try{
        const repos = await repoQuery.queryAllRepos('likes', 5);

        res.status(200).send(repos);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getAllPublicRepos,
    createRepo,
    getReposByJWT,
    updateRepo,
    deleteRepo,
    getRepoByID,
    toggleLikeRepo,
    searchMatch,
    getAllAlgoliaRepos,
    getPublicReposOfUser,
    getPopularRepos
}
