'use strict';

const express = require('express');
const { getHealth } = require('../controllers/healthController');
const { isAuthenticated } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ApiError = require('../utils/ApiError');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');

const router = express.Router();
const uploadFiles = catchAsyncError(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'Choose at least one file to upload');
  const files = req.files.map((file) => ({
    name: file.originalname,
    filename: file.filename,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/${file.filename}`,
  }));
  return sendResponse(res).created({ files }, 'Files uploaded successfully');
});

router.get('/health', getHealth);
router.post('/uploads', isAuthenticated, upload.uploadMultiple('files', 10), uploadFiles);
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/suppliers', require('./supplierRoutes'));
router.use('/sales', require('./saleRoutes'));
router.use('/stock-movements', require('./stockMovementRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/forecast', require('./forecastRoutes'));

module.exports = router;
