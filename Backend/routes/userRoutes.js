const express = require('express');
const requireAuth = require('../middleware/requireAuth');

const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);

router.get('/self', requireAuth, userController.getUserByJWT);

router.patch('/self', requireAuth, userController.updateUserByJWT);

router.delete('/self', requireAuth, userController.deleteUserByJWT);

router.get('/:id', userController.getUserByID);

module.exports = router;