const multer = require('multer');

const storage = multer.memoryStorage();

const multerLayer = (req, res, next) => {

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({Error: err.message});
    }

    next();
  });

}

const upload = multer({
  storage: storage,
  limits: {fileSize: parseInt(process.env.MAX_FILE_SIZE, 10)},   // 30 MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  }
}).single('document');

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

    console.log(file.mimetype);
  
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, TXT, PDF, DOC, and DOCX are allowed.'));
    }
  };

module.exports = multerLayer

// This is the problem for Vercel.
// const storage = multer.diskStorage({
//   destination: './downloads/',
//   filename: (req, file, cb) => {
//     cb(null, `${`${Date.now()}${path.extname(file.originalname)}`}`);
//   }
// });