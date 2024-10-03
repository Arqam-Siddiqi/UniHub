const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './downloads/',
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
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
        await upload(req, res, (err) => {
            console.log(req.file);
            if(err || !req.file){
                return res.status(400).send({"Error": err});
            }
    
            res.status(200).send({"Message": "File uploaded."});
        });
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
    uploadFile,
    downloadFile
}