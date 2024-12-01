const router = require('express').Router();
const fileController = require('../controllers/fileController');

const multerLayer = require('../middleware/multerLayer');
const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');
const documentController = require('../controllers/documentController');

router.post('/', fileController.getAllFilesFromRepo);

router.post('/create', requireAuth, multerLayer, fileController.createFile, documentController.uploadFile);

router.delete('/delete', requireAuth, fileController.getFileDetails, documentController.deleteFile);

router.patch('/update', requireAuth, fileController.updateFileByID);

router.post('/preview', optionalAuth, fileController.getFilePreview);

router.post('/download', optionalAuth, fileController.getFileDetails, documentController.downloadFile);

router.post('/parent', optionalAuth, fileController.getAllFilesFromFolder);

module.exports = router;