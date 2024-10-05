const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);

router.get('/profile', userController.getUserByJWT);

router.patch('/profile', userController.updateUserByJWT);

router.get('/:id', userController.getUserByID);

module.exports = router;