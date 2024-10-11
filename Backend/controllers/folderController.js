const folderQuery = require('../database/folderQuery');
const {validateFolderParams} = require('../utils/folderUtils');
const repoQuery = require('../database/repoQuery');

const getAllFolders = async (req, res) => {

    try{
        const folders = await folderQuery.queryAllFolders();

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getAllFoldersByRepo = async (req,res)=>{
    try{
        if(!req.body.repo_id){
            throw Error("Please send the repo_id.");
        }
        const folders = await folderQuery.queryFoldersByRepo(req.body.repo_id);

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const createFolder = async (req, res) => {

    try{
        const user_id = req.user;
        
        const validated_params = validateFolderParams(req.body, 'c');
        const repos = await repoQuery.queryAllReposOfUser(user_id);
        
        const repoIds = repos.map(data => data.id);
        if(!repoIds.includes(validated_params.repo_id)){
            throw Error(`User does not have repo with id ${validated_params.repo_id}`);
        }

        const folders = await folderQuery.queryFoldersByParent(validated_params);
        const fnames = folders.map(data=>data.name);

        if(fnames.includes(validated_params.name)){
            throw Error(`Folder already present with the name ${validated_params.name}`);
        }

        const folder = await folderQuery.createFolder(validated_params);
        res.status(200).send(folder);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
    
}

const getFoldersByParent = async (req, res) => {

    try{
        const params = req.body;
        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const folders = await folderQuery.queryFoldersByParent(params);

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const updateFolder = async (req,res)=>{
    try{
        
        res.status(200).send(folder);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
     
}

module.exports={
    getAllFolders,
    getAllFoldersByRepo,
    createFolder,
    getFoldersByParent
}