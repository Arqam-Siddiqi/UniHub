const cloud = require('../cloud_storage/cloud');
const path = require('path');

const uploadFile = async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).send({ "Error": "No file uploaded." });
    }
    
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    await cloud.upload(fileBuffer, fileName);

    res.status(200).send({ "Message": "File uploaded." });
  } 
  catch (error) {
    res.status(400).send({ "Error": error.message });
  }

}

const downloadFile = async (req, res) => {

  try{
    const filePath = req.body.filePath;
    const fileName = path.basename(filePath);

    const fileBuffer = await cloud.download(filePath);
    
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', fileBuffer.length);

    // Send the file buffer as response
    res.status(200).send(fileBuffer);
  }
  catch(error){
    res.status(400).send({"Error": error.message});
  }

}



module.exports = {
    uploadFile,
    downloadFile
}