const router = require('express').Router();

const commentController = require('../controllers/commentController');

router.get('/', commentController.getAllComments);

router.get('/self/user', commentController.getAllUserComments);

router.post('/self/repo', commentController.getAllRepoComments);

router.post('/create',commentController.createComment);

router.patch('/update', commentController.updateComment);

router.delete('/delete', commentController.deleteComment);

module.exports = router;