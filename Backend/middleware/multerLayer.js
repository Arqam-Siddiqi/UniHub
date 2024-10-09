const multer = require('multer');

// This is the problem for Vercel. Change it to memoryStorage and pray it works
// const storage = multer.diskStorage({
//   destination: './downloads/',
//   filename: (req, file, cb) => {
//     cb(null, `${`${Date.now()}${path.extname(file.originalname)}`}`);
//   }
// });
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {fileSize: 30000000},   // 30 MB
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
  
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, TXT, PDF, DOC, and DOCX are allowed.'));
    }
  };

module.exports = upload;