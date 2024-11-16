const router = require('express').Router();
const requireAuth = require('../middleware/requireAuth');

const repoController = require('../controllers/repoController');

router.get('/', repoController.getAllRepos);

router.get('/self', requireAuth, repoController.getReposByJWT);

router.post('/create', requireAuth, repoController.createRepo);

router.patch('/update', requireAuth, repoController.updateRepo);

router.delete('/delete', requireAuth, repoController.deleteRepo);

router.post('/like', requireAuth, repoController.toggleLikeRepo);

router.post('/search', requireAuth, repoController.searchMatch);

router.get('/:id', repoController.getRepoByID);

module.exports = router;