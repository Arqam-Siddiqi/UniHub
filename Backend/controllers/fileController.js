const fileQuery = require('../database/fileQuery');
const {validateFileParams, validateFileParamsForPatch} = require('../utils/fileUtils');

const getAllFilesFromRepo = async (req, res) => {

    try{
        const params = req.body;
        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const files = await fileQuery.queryFilesFromRepo(params.repo_id);

        res.status(200).send(files);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }

}

const createFile = async (req, res) => {

    try{
        const validated_params = await validateFileParams(req.body);

        const file = await fileQuery.createFile(validated_params);

        res.status(200).send(file);
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }


}

const getAllFilesFromFolder = async (req, res) => {

    try{
        const params = req.body;
        if(!params.repo_id){
            throw Error("Please send the repo_id.");
        }

        const files = await fileQuery.queryFilesByParent(params);

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
        const params = req.body;
        if(!params.id){
            throw Error("Please send the id of the file.");
        }

        const file = await fileQuery.deleteFileByID(params.id);

        res.status(200).send(file);
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
    deleteFileByID
}