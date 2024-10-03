const router = require('express').Router();

const documentController = require('../controllers/documentController');

router.post('/upload', documentController.uploadFile);

router.get('/download', documentController.downloadFile);

module.exports = router;