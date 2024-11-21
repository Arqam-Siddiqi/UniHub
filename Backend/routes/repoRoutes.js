const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');
const optionalAuth = require('../middleware/optionalAuth');

const repoController = require('../controllers/repoController');

router.get('/', repoController.getAllPublicRepos);

router.get('/self', requireAuth, repoController.getReposByJWT);

router.post('/create', requireAuth, repoController.createRepo);

router.patch('/update', requireAuth, repoController.updateRepo);

router.delete('/delete', requireAuth, repoController.deleteRepo);

router.post('/like', requireAuth, repoController.toggleLikeRepo);

router.post('/search', repoController.searchMatch);

router.get('/:id', optionalAuth, repoController.getRepoByID);

module.exports = router;