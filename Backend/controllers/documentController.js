const drive = require('../cloud_storage/drive');
const fileQuery = require('../database/fileQuery');

const uploadFile = async (req, res) => {
  
  try {
    if (!req.file) {
      return res.status(400).send({ "Error": "No file uploaded." });
    }
    
    const id = req.file.id;
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    const {fileId} = await drive.uploadFile(fileBuffer, fileName);

    try{
      await fileQuery.updateFileByID(id, {google_file_id: fileId});
    }
    catch(error){
      await drive.deleteFile(fileId);
      throw error;
    }

    res.status(200).send({"Message": "File uploaded."});
  } 
  catch (error) {
    await fileQuery.deleteFileByID(req.file.id);

    res.status(400).send({"Error": error.message });
  }

}

const downloadFile = async (req, res) => {

  try{
    const {google_file_id, name, extension} = req.file
    if(!google_file_id){
      throw Error("File path is invalid.");
    }

    const fileBuffer = await drive.downloadFile(google_file_id);

    if(!fileBuffer){
      throw Error("This file doesn't exist.");
    }
    
    res.setHeader('Content-Disposition', `inline; filename="${name + '.' + extension}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the file buffer as response
    res.status(200).send(fileBuffer);
  }
  catch(error){
    res.status(400).send({"Error": error.message});
  }

}

const deleteFile = async (req, res, next) => {

  try{
    const params = req.body;
    if(!params.id){
        throw Error("Please send the id of the file.");
    }

    const {google_file_id} = req.file;
    const {id} = params;
    
    const file = await fileQuery.deleteFileByID(id);

    if(!file){
      throw Error("This file doesn't exist.");
    }

    await drive.deleteFile(google_file_id);

    res.status(200).send(file);
  }
  catch(error){
    res.status(400).send({"Error": error.message});
  }

}


module.exports = {
    uploadFile,
    downloadFile,
    deleteFile
}