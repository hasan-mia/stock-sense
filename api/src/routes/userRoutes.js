'use strict';

const express = require('express');
const userController = require('../controllers/userController');
const { isAuthenticated, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const userValidators = require('../validators/userValidators');

const router = express.Router();
router.use(isAuthenticated, requireRole('admin'));
router.get('/', validateRequest(userValidators.listUsers, 'query'), userController.listUsers);
router.post('/', validateRequest(userValidators.createUser), userController.createUser);
router.patch(
  '/:id',
  validateRequest(userValidators.userId, 'params'),
  validateRequest(userValidators.updateUser),
  userController.updateUser,
);
router.delete('/:id', validateRequest(userValidators.userId, 'params'), userController.deleteUser);

module.exports = router;
