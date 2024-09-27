const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

router.get('/', userController.getAllUsers);


router.post('/create', userController.createUser);

router.put('/update', userController.updateUserByEmail);

module.exports = router;