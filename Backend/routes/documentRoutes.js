const router = require('express').Router();

const upload = require('../middleware/multerLayer');
const documentController = require('../controllers/documentController');

router.post('/upload', upload, documentController.uploadFile);

router.post('/download', documentController.downloadFile);

module.exports = router;