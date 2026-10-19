'use strict';

const express = require('express');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const authValidators = require('../validators/authValidators');

const router = express.Router();
router.post('/register', validateRequest(authValidators.register), authController.register);
router.post('/login', validateRequest(authValidators.login), authController.login);
router.get('/me', isAuthenticated, authController.me);

module.exports = router;
