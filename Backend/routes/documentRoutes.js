const router = require('express').Router();

const documentController = require('../controllers/documentController');

router.post('/upload', documentController.uploadFile);

module.exports = router;