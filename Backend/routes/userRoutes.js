const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);

router.get('/self', userController.getUserByJWT);

router.patch('/self', userController.updateUserByJWT);

router.delete('/self', userController.deleteUserByJWT);

router.get('/:id', userController.getUserByID);

module.exports = router;