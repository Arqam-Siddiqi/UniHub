const folderQuery = require('../database/folderQuery');
const {validateRepoParams} = require('../utils/folderUtils');
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
            throw Error("Fill in all the required fields.");
        }
        const folders = await folderQuery.getFoldersByRepo(req.body.repo_id);

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

const createFolder = async (req, res)=>{
    try{
        const user_id=req.user;
        const validated_params=validateRepoParams(req.body, 'c');
        const repos = await repoQuery.queryAllReposOfUser(user_id);
        
        const repoIds = repos.map(data => data.id);
        if(!repoIds.includes(req.body.repo_id)){
            throw Error(`No repo with id ${req.body.repo_id}`);
        }
        const folders = await folderQuery.getFoldersByRepo(req.body.repo_id);
        const fnames = folders.map(data=>data.name);
        if(fnames.includes(req.body.name)){
            throw Error(`Folder already present with the name ${req.body.name}`);
        }
        const folder = await folderQuery.createFolder(validated_params);
        res.status(200).send(folder);
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
    createFolder
}