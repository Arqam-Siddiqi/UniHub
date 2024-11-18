const router = require('express').Router();

const mapController = require('../controllers/mapController');

router.get('/', mapController.getFullMap);

router.post('/faculty', mapController.getFaculty);

module.exports = router;