const path = require('path');
const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {fileSize: 30000000},   // 30 MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('document');


const uploadFile = (req, res) => {

    try{
        upload(req, res, (err) => {
          
            if(err || !req.file){
                return res.status(400).send({"Error": err});
            }
    
            console.log(req.file);
            res.status(200).send({"Message": "File uploaded."});
        });
    }
    catch(error){
        res.status(400).send({"Error": error.message});
    }
}

// Allowed extensions
function checkFileType(file, cb) {

    const filetypes = /pdf|doc|docx|txt|png|jpg|jpeg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
  
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only documents (PDF, DOC, DOCX, TXT, PNG, JPG, JPEG) are allowed!');
    }
    
  }

module.exports = {
    uploadFile
}