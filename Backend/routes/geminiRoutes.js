const router = require('express').Router();

const geminiController = require('../controllers/geminiController');
const fileController = require('../controllers/fileController');

const rateLimit = require('express-rate-limit');

const geminiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // limit each IP to 100 requests per windowMs
});

router.use(geminiLimiter);

router.post('/quiz', fileController.getFileDetails, geminiController.createQuiz);

router.post('/notes', fileController.getFileDetails, geminiController.createNotes);

module.exports = router;