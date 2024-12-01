const router = require('express').Router();

const commentController = require('../controllers/commentController');

const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/', optionalAuth, commentController.getAllComments);

router.get('/self/user', optionalAuth, commentController.getAllUserComments);

router.post('/self/repo', optionalAuth, commentController.getAllRepoComments);

router.post('/create', requireAuth, commentController.createComment);

router.patch('/update', requireAuth, commentController.updateComment);

router.delete('/delete', requireAuth, commentController.deleteComment);

module.exports = router;