const folderQuery = require('../database/folderQuery');
const fileQuery = require('../database/fileQuery');
const {validateFolderParams} = require('../utils/folderUtils');
const repoQuery = require('../database/repoQuery');
const drive = require('../cloud_storage/drive');

const getAllFolders = async (req, res) => {

    try{
        const user_id = req.user;
        const folders = await folderQuery.queryAllFolders(user_id);

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getAllFoldersByRepo = async (req,res)=>{
    try{
        const {repo_id} = req.body;

        if(!repo_id){
            throw Error("Please send the repo_id.");
        }

        const folders = await folderQuery.queryFoldersByRepo(repo_id, req.user);

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
        const user_id = req.user;

        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const folders = await folderQuery.queryFoldersByParent(params, user_id);

        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const updateFolder = async (req,res)=>{
    try{
        const user_id = req.user;
        const validated_params = validateFolderParams(req.body, 'u');
        const repo=await folderQuery.getFolder(validated_params.id);
        let repos=await repoQuery.queryAllReposOfUser(user_id);
            repos=repos.map(data=>data.id);
            if(!repos.includes(repo.repo_id)){
                throw Error(`This repo does not belong to current user".`);
            }
        let p_Ids = await folderQuery.queryFoldersByRepo(repo.repo_id);
        p_Ids=p_Ids.map(data=>data.id);
        let params = {repo_id:repo.repo_id, parent_id:validated_params.id};
        let c_Ids = await folderQuery.queryFoldersByParent(params);
        
        c_Ids=c_Ids.map(data=>data.id);
        p_Ids=p_Ids.filter(item=> !c_Ids.includes(item) && item!==validated_params.id);
        // console.log(`Allowed parent IDs: ${p_Ids}`);
        if(validated_params.parent_id){
            if(!p_Ids.includes(validated_params.parent_id) && validated_params.parent_id!==null ){
                throw Error('No such parent folder available');
            }
        }
        
        let names;
        params={repo_id:repo.repo_id, parent_id:validated_params.parent_id};
        names= await folderQuery.queryFoldersByParent(params);
        names=names.map(data=>data.name);
        // console.log(`Not allowed names: ${names}`);
        const currName=await folderQuery.getFolder(validated_params.id);
        if(names.includes(validated_params.name) && currName.name!==validated_params.name){
            throw Error(`Already a folder names ${validated_params.name} is present in current directory`);
        }

        const folders=await folderQuery.updateFolder(validated_params);
        res.status(200).send(folders);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
     
}

const deleteFolder = async (req,res)=>{
    try {
        
        const user_id = req.user;
        const validated_params = validateFolderParams(req.body, 'd');

        const repo = await folderQuery.getFolder(validated_params.id);
        if(repo === undefined){
            throw Error('No such folder present');
        }

        let repos = await repoQuery.queryAllReposOfUser(user_id);
        repos = repos.map(data => data.id);
        if(!repos.includes(repo.repo_id)){
            throw Error(`This repo does not belong to current user".`);
        }
        
        const fileIds = await fileQuery.deleteChildrenOfFolder(validated_params.id, user_id);

        await drive.deleteFiles(fileIds);

        const folder = await folderQuery.deleteFolder(validated_params);
        res.status(200).send(folder);
    } catch (error) {
        res.status(400).send({"Error": error.message});
    }
}
module.exports={
    getAllFolders,
    getAllFoldersByRepo,
    createFolder,
    getFoldersByParent,
    updateFolder,
    deleteFolder
}