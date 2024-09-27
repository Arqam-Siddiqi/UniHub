const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);

router.put('/update', userController.updateUserByEmail);

module.exports = router;