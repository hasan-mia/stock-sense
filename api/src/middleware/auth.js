const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const catchAsyncError = require('./catchAsyncError');

const isAuthenticated = catchAsyncError(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated. Token required.');
  }

  if (!process.env.JWT_SECRET) throw new ApiError(500, 'Authentication is not configured', false);
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) throw new ApiError(401, 'Not authenticated. Token required.');
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) throw new Error('Token has no subject');
    const user = await User.findByPk(decoded.id);
    if (!user) throw new ApiError(401, 'User account is no longer available');
    req.user = { id: user.id, role: user.role };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Invalid or expired token.');
  }
  return next();
});

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Not authenticated.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Access denied. Insufficient role.'));
    }
    next();
  };
};

module.exports = { isAuthenticated, requireRole };
