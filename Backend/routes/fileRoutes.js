const router = require('express').Router();
const fileController = require('../controllers/fileController');

const multerLayer = require('../middleware/multerLayer');
const documentController = require('../controllers/documentController');

router.post('/', fileController.getAllFilesFromRepo);

router.post('/create', multerLayer, fileController.createFile, documentController.uploadFile);

router.post('/preview', fileController.getFilePreview);

router.post('/download', fileController.getFileDetails, documentController.downloadFile);

router.post('/parent', fileController.getAllFilesFromFolder);

router.delete('/delete', fileController.getFileDetails, documentController.deleteFile);

router.patch('/update', fileController.updateFileByID);

module.exports = router;