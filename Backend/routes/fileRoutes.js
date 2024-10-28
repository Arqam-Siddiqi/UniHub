const router = require('express').Router();
const fileController = require('../controllers/fileController');

const upload = require('../middleware/multerLayer');
const documentController = require('../controllers/documentController');

router.post('/', fileController.getAllFilesFromRepo);

router.post('/create', upload, fileController.createFile, documentController.uploadFile);

router.post('/view', fileController.getFileDetails, documentController.downloadFile);

router.post('/parent', fileController.getAllFilesFromFolder);

router.delete('/delete', documentController.deleteFile, fileController.deleteFileByID);

router.patch('/update', fileController.updateFileByID);

module.exports = router;