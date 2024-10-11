const router = require('express').Router();
const fileController = require('../controllers/fileController');

router.post('/', fileController.getAllFilesFromRepo);

router.post('/create', fileController.createFile);

router.post('/parent', fileController.getAllFilesFromFolder);

router.delete('/delete', fileController.deleteFileByID);

router.patch('/update', fileController.updateFileByID);

module.exports = router;