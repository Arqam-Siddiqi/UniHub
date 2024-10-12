const router = require('express').Router();

const folderController = require('../controllers/folderController');

router.get('/', folderController.getAllFolders);

router.post('/self', folderController.getAllFoldersByRepo);

router.post('/parent', folderController.getFoldersByParent);

router.post('/create', folderController.createFolder);

router.patch('/update', folderController.updateFolder);

router.delete('/delete', folderController.deleteFolder);

module.exports = router;