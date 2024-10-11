const router = require('express').Router();
const fileController = require('../controllers/fileController');

router.post('/', fileController.getAllFilesFromRepo);

router.post('/create', fileController.createFile);

module.exports = router;