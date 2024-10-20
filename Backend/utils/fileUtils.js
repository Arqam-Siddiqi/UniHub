const fileQuery = require('../database/fileQuery');
const repoQuery = require('../database/repoQuery');
const folderQuery = require('../database/folderQuery');

const path = require('path');

// call with await
const validateFileParams = async ({originalname, size}, {repo_id, folder_id}) => {

    if(!originalname || !size){
        throw Error("File was not properly parsed by upload().");
    }

    const extension = path.extname(originalname);
    const name = path.basename(originalname, extension);
    const fileSize = size;

    if(!name || !extension || !fileSize || !repo_id){
        throw Error("Please fill all the required fields.");
    }

    if(extension.length > 8){
        throw Error("Extensions can only be of 8 or less letters.");
    }

    const files = await fileQuery.queryFilesByParent({repo_id, folder_id});
    const file_name = files.map(data => data.name + "." +  data.extension);

    if(file_name.includes(name + "." + extension)){
        throw Error(`There already exists a file named \"${name}\" in the same directory.`)
    }

    if(fileSize > parseInt(process.env.MAX_FILE_SIZE, 10)){
        throw Error("File size is greater than 30 MB.");
    }

    return {
        name,
        extension,
        fileSize,
        repo_id,
        folder_id
    }

}

// repo_id and folder_id are only used for validation
// call with await
const validateFileParamsForPatch = async (user_id, {id, name, extension, repo_id, folder_id}) => {

    if(!id){
        throw Error("Please send the ID of the file.");
    }

    if(!repo_id){
        throw Error("Please send Repo ID of the file.");
    }

    if(!folder_id){
        throw Error("Please send the Folder ID of the file.");
    }

    if(!name && !extension){
        throw Error("Please fill in the fields.");
    }

    const repo_check = await repoQuery.doesUserOwnRepo(user_id, repo_id);
    if(!repo_check){
        throw Error("This user does not own the repository that contains the file.");
    }

    if(folder_id){
        const folder_check = await folderQuery.doesRepoOwnFolder(repo_id, folder_id);
        if(!folder_check){
            throw Error("This repo does not own the folder that contains the file.");
        }
    }

    const files = await fileQuery.queryFilesByParent({repo_id, folder_id});
    const file_name = files.map(data => data.name + "." +  data.extension);

    if(file_name.includes(name + "." + extension)){
        throw Error(`There already exists a file named \"${name}\" in the same directory.`)
    }

    return {
        name,
        extension
    }

}


module.exports = {
    validateFileParams,
    validateFileParamsForPatch
}