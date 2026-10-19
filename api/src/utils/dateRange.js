'use strict';

const { Op } = require('sequelize');

const addDateRange = (where, from, to, field = 'createdAt') => {
  if (!from && !to) return where;
  const range = {};
  if (from) range[Op.gte] = new Date(from);
  if (to) {
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(to);
    const end = new Date(to);
    if (dateOnly) {
      end.setUTCDate(end.getUTCDate() + 1);
      range[Op.lt] = end;
    } else {
      range[Op.lte] = end;
    }
  }
  where[field] = range;
  return where;
};

module.exports = { addDateRange };
