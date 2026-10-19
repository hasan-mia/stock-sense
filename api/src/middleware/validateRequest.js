'use strict';

const ApiError = require('../utils/ApiError');

const validateRequest = (schema, target = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: false,
      convert: true,
    });
    if (error) {
      const errors = error.details.map(({ path, message }) => ({ field: path.join('.'), message }));
      return next(new ApiError(400, 'Validation failed', true, '', errors));
    }
    if (target === 'query') req.validatedQuery = value;
    else req[target] = value;
    return next();
  };
};

module.exports = validateRequest;
