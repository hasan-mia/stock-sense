'use strict';

const ApiError = require('./ApiError');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function parsePositiveInteger(value, name, fallback, max = Number.MAX_SAFE_INTEGER) {
  if (value === undefined || value === null || value === '') return fallback;
  const stringValue = String(value);
  if (!/^\d+$/.test(stringValue)) throw new ApiError(400, `${name} must be a positive integer.`);
  const parsed = Number(stringValue);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${name} must be a positive integer.`);
  }
  return Math.min(parsed, max);
}

function parsePaginationParams(query = {}, options = {}) {
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;
  const page = parsePositiveInteger(query.page, 'page', 1);
  const limit = parsePositiveInteger(query.limit, 'limit', defaultLimit, maxLimit);
  const offset = (page - 1) * limit;
  if (!Number.isSafeInteger(offset)) throw new ApiError(400, 'Requested page is too large.');
  return { page, limit, offset };
}

/**
 * Paginate a Sequelize model using findAndCountAll.
 * @returns {Promise<{data: Array, meta: {page: number, limit: number, total: number, totalPages: number}}>}
 */
async function paginate(model, findOptions = {}, params = {}) {
  if (!model || typeof model.findAndCountAll !== 'function') {
    throw new TypeError('paginate expects a Sequelize model.');
  }
  const page = params.page || 1;
  const limit = params.limit || DEFAULT_LIMIT;
  const offset = params.offset ?? (page - 1) * limit;
  const result = await model.findAndCountAll({
    ...findOptions,
    limit,
    offset,
    distinct: findOptions.distinct ?? Boolean(findOptions.include),
  });
  const total = Array.isArray(result.count) ? result.count.length : Number(result.count);
  return {
    data: result.rows,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}

module.exports = { parsePaginationParams, paginate, DEFAULT_LIMIT, MAX_LIMIT };
