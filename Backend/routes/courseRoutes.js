const router = require('express').Router();

const courseController = require('../controllers/courseController');

router.get('/', courseController.getUserCourses);

router.get('/refresh', courseController.refreshUserCourses, courseController.getUserCourses);

module.exports = router;

