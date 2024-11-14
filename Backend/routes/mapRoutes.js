const router = require('express').Router();

const mapController = require('../controllers/mapController');

router.get('/', mapController.getFullMap);

module.exports = router;