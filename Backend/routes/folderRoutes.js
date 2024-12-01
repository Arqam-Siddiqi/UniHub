const router = require('express').Router();

const folderController = require('../controllers/folderController');
const optionalAuth = require('../middleware/optionalAuth');
const requireAuth = require('../middleware/requireAuth');

router.get('/', optionalAuth, folderController.getAllFolders);

router.post('/self', optionalAuth, folderController.getAllFoldersByRepo);

router.post('/parent', optionalAuth, folderController.getFoldersByParent);

router.post('/create', requireAuth, folderController.createFolder);

router.patch('/update', requireAuth, folderController.updateFolder);

router.delete('/delete', requireAuth, folderController.deleteFolder);

module.exports = router;