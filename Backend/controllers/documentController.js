const multer = require('multer');
const path = require('path');
const cloud = require('../cloud_storage/cloud');

// This is the problem for Vercel. Change it to memoryStorage and pray it works
const storage = multer.diskStorage({
  destination: './downloads/',
  filename: (req, file, cb) => {
    cb(null, `${`${Date.now()}${path.extname(file.originalname)}`}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {fileSize: 30000000},   // 30 MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('document');


const uploadFile = async (req, res) => {

    try{

        await upload(req, res, async (err) => {
          if(err){
            console.log(err);
            return res.status(400).send({"Error": err});
          }
          
          const fileName = req.file.originalname;
          const pathOfFile = req.file.destination + req.file.filename;  
          
          await cloud.upload('f3', pathOfFile, fileName);
        });

        res.status(200).send({"Message": "File uploaded."});
    }
    catch(error){
        res.status(400).send({"Error": error.message});
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

// Allowed extensions
const checkFileType = (file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'application/pdf',
    'text/plain',
    'application/msword',             // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, TXT, PDF, DOC, and DOCX are allowed.'));
  }
};

module.exports = {
    uploadFile,
    downloadFile
}