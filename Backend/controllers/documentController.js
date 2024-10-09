const path = require('path');
const cloud = require('../cloud_storage/cloud');

const uploadFile = async (req, res) => {

  try {
    if (!req.file) {
      return res.status(400).send({ "Error": "No file uploaded" });
    }
    
    const fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;

    await cloud.upload('f3', fileBuffer, fileName);

    res.status(200).send({ "Message": "File uploaded." });
  } 
  catch (error) {
    res.status(400).send({ "Error": error.message });
  }

}

const downloadFile = (req, res) => {

  try{
    const filePath = './downloads/' + 'APznzaZfTXy8AzjdtzpkMg-0O4meK62R8nVED-5LuM3pbkrAXl42Cd1xV0LjsVmIYVQSVr7hpJYELcVY8m-aI1pB_Zr2JsI-y9Ce0ymXm1XEnYNq91qJMZ-c8hf96Njq0kH22zF-4LQ9NdDLLsjr5G-rI2dJROtPa7Xtc5hsvwH6UO1YAS_kYANF_cq0V3DecJ5LQPy8C8ocSUoH5nYXPXYoO5ZcU2.pdf'

    res.download(filePath, (err) => {
      if (err) {
        console.error(err);
        res.status(404).send('File not found');
      }
    });

  }
  catch(error){
    res.status(400).send({"Error": error.message});
  }

}



module.exports = {
    uploadFile,
    downloadFile
}