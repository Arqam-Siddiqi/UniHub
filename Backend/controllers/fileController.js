const fileQuery = require('../database/fileQuery');
const {validateFileParams, validateFileParamsForPatch} = require('../utils/fileUtils');

const getAllFilesFromRepo = async (req, res) => {

    try{
        const params = req.body;
        const user_id = req.user;

        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const files = await fileQuery.queryFilesFromRepo(params.repo_id, user_id);

        res.status(200).send(files);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const createFile = async (req, res, next) => {

    try{
        if(!req.file){
            throw Error("File was not uploaded.");
        }

        const validated_params = await validateFileParams(req.file, req.body);

        const file = await fileQuery.createFile(validated_params);

        console.log(file);

        // customization for documentController
        req.file.id = file.id;
        req.file.repo_id = file.repo_id;

        next();
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }


}

const getAllFilesFromFolder = async (req, res) => {

    try{
        const params = req.body;
        const user_id = req.user;
        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const files = await fileQuery.queryFilesByParent(params, user_id);

        res.status(200).send(files);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const updateFileByID = async (req, res) => {

    try{
        const validated_params = await validateFileParamsForPatch(req.user, req.body);
        const id = req.body.id;

        const file = await fileQuery.updateFileByID(id, validated_params);

        res.status(200).send(file);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}


const deleteFileByID = async (req, res) => {

    try{
        // Existence Check for params.id is in documentController

        const file = await fileQuery.deleteFileByID(req.body.id);

        res.status(200).send(file);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getFileDetails = async (req, res, next) => {
    
    try{
        const params = req.body;
        if(!params.id){
            throw Error("Please send the id of the file.");
        }

        // if(!params.repo_id){
        //     throw Error("Please send the repo_id.");
        // }

        const file = await fileQuery.queryFileByID(params.id);
        
        if(!file){
            throw Error("File does not exist.");
        }
        
        req.file = {
            google_file_id: file.google_file_id,
            name: file.name,
            extension: file.extension
        }
        
        next();
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const getFilePreview = async (req, res) => {

    try{
        const {id} = req.body;
        const user_id = req.user;

        if(!id){
            throw Error("Please fill all the required fields.");
        }

        const file = await fileQuery.queryFileByID(id, user_id);

        const preview = `https://drive.google.com/file/d/${file.google_file_id}/preview?usp=drivesdk`;
        const link = `https://drive.google.com/file/d/${file.google_file_id}/view?usp=drivesdk`;
        
        res.status(200).send({preview, link});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

module.exports = {
    getAllFilesFromFolder,
    getAllFilesFromRepo,
    createFile,
    updateFileByID,
    deleteFileByID,
    getFileDetails,
    getFilePreview
}