const router = require('express').Router();

const repoController = require('../controllers/repoController');

router.get('/', repoController.getAllRepos);

router.get('/self', repoController.getReposByJWT);

router.post('/create', repoController.createRepo);

router.patch('/update', repoController.updateRepo);

router.delete('/delete', repoController.deleteRepo);

router.post('/like', repoController.toggleLikeRepo);

router.get('/:id', repoController.getRepoByID);

module.exports = router;