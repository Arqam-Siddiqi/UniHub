const router = require('express').Router();

const geminiController = require('../controllers/geminiController');
const fileController = require('../controllers/fileController');

router.post('/quiz', fileController.getFileDetails, geminiController.createQuiz);

router.post('/notes', fileController.getFileDetails, geminiController.createNotes);

module.exports = router;