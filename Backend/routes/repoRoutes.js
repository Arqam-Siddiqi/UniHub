const router = require('express').Router();

const repoController = require('../controllers/repoController');

router.get('/', repoController.getAllRepos);

router.get('/self', repoController.getReposByJWT);

router.post('/create', repoController.createRepo);

module.exports = router;