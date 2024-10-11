const router = require('express').Router();

const folderController = require('../controllers/folderController');

router.get('/', folderController.getAllFolders);

router.post('/self', folderController.getAllFoldersByRepo);

router.post('/create', folderController.createFolder);

//router.patch('/update', folderController.updateFolder);

// router.delete('/delete', folderController.deleteRepo);

module.exports = router;