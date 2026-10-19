'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('../config/paths');
const ApiError = require('../utils/ApiError');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const mimeExtensions = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
  ['video/mp4', '.mp4'],
  ['video/webm', '.webm'],
  ['video/ogg', '.ogv'],
  ['video/quicktime', '.mov'],
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
  ['application/vnd.ms-excel', '.xls'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
  ['text/plain', '.txt'],
  ['text/csv', '.csv'],
]);

const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, UPLOAD_DIR),
  filename: (req, file, callback) =>
    callback(null, `${crypto.randomUUID()}${mimeExtensions.get(file.mimetype)}`),
});

const upload = multer({
  storage,
  fileFilter: (req, file, callback) => {
    if (!mimeExtensions.has(file.mimetype))
      return callback(new ApiError(400, `File type ${file.mimetype} is not allowed`));
    return callback(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024, files: 10 },
});

const uploadSingle = (fieldName = 'file') => upload.single(fieldName);
const uploadMultiple = (fieldName = 'files', maxCount = 10) => upload.array(fieldName, maxCount);

module.exports = { uploadSingle, uploadMultiple };
