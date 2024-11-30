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
      'image/jpeg',        // JPEG images
      'image/png',         // PNG images
      'image/gif',         // GIF images
      'image/svg+xml',     // SVG images
      'application/pdf',   // PDF files
      'text/plain',        // Plain text files (.txt)
      'audio/mpeg',        // MP3 audio files
      'audio/wav',         // WAV audio files
      'video/mp4',         // MP4 video files
      'application/rtf',   // Rich Text Format files
      'application/msword', // MS Word (.doc)
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // MS Word (.docx)
      'application/vnd.ms-excel', // MS Excel (.xls)
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // MS Excel (.xlsx)
      'application/vnd.ms-powerpoint', // MS PowerPoint (.ppt)
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // PowerPoint (.pptx)
      'text/csv',           // CSV files

      'text/x-c',                    // C source files (.c)
      'text/x-csrc',                 // C source files (alternative)
      'text/x-c++src',               // C++ source files (.cpp)
      'text/x-java-source',          // Java source files (.java)
      'text/x-python',               // Python source files (.py)
      'text/x-ruby',                 // Ruby source files (.rb)
      'text/x-perl',                 // Perl source files (.pl)
      'text/x-shellscript',          // Shell scripts (.sh)
      'text/x-haskell',              // Haskell source files (.hs)
      'text/x-go',                   // Go source files (.go)
      'text/x-sql',                  // SQL files (.sql)
      'text/x-swift',                // Swift source files (.swift)
      'text/x-kotlin',               // Kotlin source files (.kt)
      'text/x-matlab',               // MATLAB files (.m)
      'text/x-r',                    // R programming files (.r)
      'text/x-rust',                 // Rust source files (.rs)
      'text/x-tex',                  // LaTeX files (.tex)
      'text/x-markdown',             // Markdown files (.md)
      'application/xml',             // XML files (.xml)
      'application/json',            // JSON files (.json)
      'text/css',                    // CSS files (.css)
      'text/html',                   // HTML files (.html, .htm)
    ];

    console.log(file.mimetype);
  
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, JPEG, TXT, PDF, DOC, and DOCX are allowed.'));
    }
}

module.exports = multerLayer

// This is the problem for Vercel.
// const storage = multer.diskStorage({
//   destination: './downloads/',
//   filename: (req, file, cb) => {
//     cb(null, `${`${Date.now()}${path.extname(file.originalname)}`}`);
//   }
// });