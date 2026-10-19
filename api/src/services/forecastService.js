'use strict';

const { Op } = require('sequelize');
const { Product, Sale, SaleItem, Category, Supplier } = require('../models');
const ApiError = require('../utils/ApiError');

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

const getInputs = async ({ days = 60, categoryId, productId, from, to } = {}) => {
  const end = to ? new Date(`${dateKey(to)}T00:00:00.000Z`) : new Date();
  const endDate = new Date(end);
  endDate.setUTCHours(0, 0, 0, 0);
  const start = from ? new Date(`${dateKey(from)}T00:00:00.000Z`) : new Date(endDate);
  if (!from) start.setUTCDate(start.getUTCDate() - (days - 1));
  const rangeDays = Math.floor((endDate - start) / 86400000) + 1;
  const dates = Array.from({ length: rangeDays }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const products = await Product.findAll({
    where: { ...(categoryId ? { categoryId } : {}), ...(productId ? { id: productId } : {}) },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: Supplier, as: 'supplier', attributes: ['id', 'name'] },
    ],
    order: [['name', 'ASC']],
  });
  const items = await SaleItem.findAll({
    attributes: ['productId', 'quantity'],
    where: productId ? { productId } : {},
    include: [
      {
        model: Sale,
        as: 'sale',
        attributes: ['createdAt'],
        where: { status: 'completed', createdAt: { [Op.gte]: start, [Op.lt]: endDate } },
        required: true,
      },
    ],
  });
  const demand = new Map();
  for (const item of items) {
    const date = item.sale.createdAt.toISOString().slice(0, 10);
    if (!demand.has(item.productId)) demand.set(item.productId, new Map());
    const byDay = demand.get(item.productId);
    byDay.set(date, (byDay.get(date) || 0) + Number(item.quantity));
  }
  return { products, demand, dates };
};

const calcForecast = (
  product,
  daily,
  { days, horizon, leadTimeDays, reviewPeriodDays, safetyStock },
) => {
  const totalUnitsSold = daily.reduce((sum, value) => sum + value, 0);
  const averageDailySales = totalUnitsSold / days;
  const recentDays = daily.slice(-7);
  const recent7DayAverage = recentDays.reduce((sum, value) => sum + value, 0) / recentDays.length;
  const expectedDailyDemand = recent7DayAverage;
  const forecastDemand = expectedDailyDemand * horizon;
  const currentStock = Number(product.stockQty);
  const stockoutDays =
    expectedDailyDemand === 0 ? null : Number((currentStock / expectedDailyDemand).toFixed(2));
  const buffer = safetyStock ?? Number(product.reorderLevel);
  const targetStock = expectedDailyDemand * (leadTimeDays + reviewPeriodDays) + buffer;
  const recommendedRestockQty = Math.max(0, Math.ceil(targetStock - currentStock));
  const nonzeroDays = daily.filter((quantity) => quantity > 0).length;
  const coverage = nonzeroDays / days;
  const quality =
    totalUnitsSold === 0
      ? 'insufficient_data'
      : coverage >= 0.3
        ? 'good'
        : coverage >= 0.1
          ? 'moderate'
          : 'limited';
  return {
    product: {
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name,
      supplier: product.supplier?.name,
    },
    windowDays: days,
    totalUnitsSold,
    averageDailySales: Number(averageDailySales.toFixed(3)),
    recent7DayAverage: Number(recent7DayAverage.toFixed(3)),
    forecastHorizonDays: horizon,
    forecastDemand: Number(forecastDemand.toFixed(2)),
    currentStock,
    reorderLevel: Number(product.reorderLevel),
    estimatedDaysUntilStockout: stockoutDays,
    stockoutDemandBasis: 'recent_7_day_average',
    recommendedRestockQty,
    confidence: { quality, activeDays: nonzeroDays, coverage: Number(coverage.toFixed(3)) },
  };
};

const getForecasts = async (options = {}) => {
  const days =
    options.from && options.to
      ? Math.floor(
          (new Date(`${dateKey(options.to)}T00:00:00.000Z`) -
            new Date(`${dateKey(options.from)}T00:00:00.000Z`)) /
            86400000,
        ) + 1
      : Number(options.days || process.env.FORECAST_HISTORY_DAYS || 60);
  const horizon = Number(options.horizon || process.env.FORECAST_DEFAULT_DAYS || 30);
  if (
    Boolean(options.from) !== Boolean(options.to) ||
    !Number.isInteger(days) ||
    days < 7 ||
    days > 365 ||
    !Number.isInteger(horizon) ||
    horizon < 1 ||
    horizon > 365
  )
    throw new ApiError(
      400,
      'Provide both from and to for a 7–365 day range, and a horizon from 1–365',
    );
  const leadTimeDays = Number(process.env.FORECAST_LEAD_TIME_DAYS || 7);
  const reviewPeriodDays = Number(process.env.FORECAST_REVIEW_PERIOD_DAYS || 7);
  if (
    ![leadTimeDays, reviewPeriodDays].every(
      (value) => Number.isInteger(value) && value >= 0 && value <= 365,
    )
  )
    throw new ApiError(500, 'Forecast lead-time configuration must be an integer from 0 to 365');
  const safetyStock = options.safetyStock === undefined ? undefined : Number(options.safetyStock);
  if (safetyStock !== undefined && (!Number.isFinite(safetyStock) || safetyStock < 0))
    throw new ApiError(400, 'safetyStock must be a nonnegative number');
  const { products, demand, dates } = await getInputs({
    days,
    categoryId: options.categoryId,
    productId: options.productId,
    from: options.from,
    to: options.to,
  });
  const forecasts = products.map((product) =>
    calcForecast(
      product,
      dates.map((date) => demand.get(product.id)?.get(date) || 0),
      { days, horizon, leadTimeDays, reviewPeriodDays, safetyStock },
    ),
  );
  return forecasts;
};

const overview = async (options) => {
  const forecasts = await getForecasts(options);
  return {
    products: forecasts.length,
    productsAtRisk: forecasts.filter(
      (row) =>
        row.estimatedDaysUntilStockout !== null &&
        row.estimatedDaysUntilStockout <= row.forecastHorizonDays,
    ).length,
    recommendedProducts: forecasts.filter((row) => row.recommendedRestockQty > 0).length,
    totalRecommendedUnits: forecasts.reduce((sum, row) => sum + row.recommendedRestockQty, 0),
    dataQuality: {
      insufficient: forecasts.filter((row) => row.confidence.quality === 'insufficient_data')
        .length,
      limited: forecasts.filter((row) => row.confidence.quality === 'limited').length,
      moderate: forecasts.filter((row) => row.confidence.quality === 'moderate').length,
      good: forecasts.filter((row) => row.confidence.quality === 'good').length,
    },
  };
};

const backtest = async () => {
  const { products, demand, dates } = await getInputs({ days: 60 });
  const training = dates.slice(0, 45);
  const evaluation = dates.slice(45);
  const results = products.map((product) => {
    const byDay = demand.get(product.id) || new Map();
    const trainTotal = training.reduce((sum, date) => sum + (byDay.get(date) || 0), 0);
    const trainingStart = new Date(`${training[0]}T00:00:00.000Z`);
    if (new Date(product.createdAt) > trainingStart)
      return {
        productId: product.id,
        name: product.name,
        status: 'insufficient_history',
        mae: null,
        sampleSize: 0,
      };
    const recentTraining = training.slice(-7);
    const predictedPerDay =
      recentTraining.reduce((sum, date) => sum + (byDay.get(date) || 0), 0) / recentTraining.length;
    const baselineMean = trainTotal / training.length;
    const errors = evaluation.map((date) => Math.abs(predictedPerDay - (byDay.get(date) || 0)));
    const baselineErrors = evaluation.map((date) =>
      Math.abs(baselineMean - (byDay.get(date) || 0)),
    );
    const zeroErrors = evaluation.map((date) => byDay.get(date) || 0);
    return {
      productId: product.id,
      name: product.name,
      status: 'evaluated',
      mae: Number((errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(3)),
      baseline45DayMeanMae: Number(
        (baselineErrors.reduce((a, b) => a + b, 0) / baselineErrors.length).toFixed(3),
      ),
      zeroDemandMae: Number((zeroErrors.reduce((a, b) => a + b, 0) / zeroErrors.length).toFixed(3)),
      sampleSize: errors.length,
      trainingPeriod: { from: training[0], to: training.at(-1) },
      evaluationPeriod: { from: evaluation[0], to: evaluation.at(-1) },
      predictedDailyUnits: Number(predictedPerDay.toFixed(3)),
    };
  });
  const evaluated = results.filter((row) => row.status === 'evaluated');
  const baseline45DayMeanMae = evaluated.length
    ? Number(
        (
          evaluated.reduce((sum, row) => sum + row.baseline45DayMeanMae, 0) / evaluated.length
        ).toFixed(3),
      )
    : null;
  const zeroDemandMae = evaluated.length
    ? Number(
        (evaluated.reduce((sum, row) => sum + row.zeroDemandMae, 0) / evaluated.length).toFixed(3),
      )
    : null;
  const overallMae = evaluated.length
    ? Number((evaluated.reduce((sum, row) => sum + row.mae, 0) / evaluated.length).toFixed(3))
    : null;
  const method =
    'Recent 7-day mean from the 45-day training window evaluated on the following 15 days';
  const productLines = results.map((row) =>
    row.status === 'evaluated'
      ? `  - ${row.name}: forecast MAE ${row.mae}, 45-day mean ${row.baseline45DayMeanMae}, zero-demand ${row.zeroDemandMae}`
      : `  - ${row.name}: skipped (insufficient history)`,
  );
  console.info(
    [
      '[Forecast backtest] Completed',
      `  Method: ${method}`,
      `  Training: ${training[0]} to ${training.at(-1)} (45 days)`,
      `  Evaluation: ${evaluation[0]} to ${evaluation.at(-1)} (15 days)`,
      `  Products: ${evaluated.length} evaluated, ${results.length - evaluated.length} skipped`,
      `  Average absolute error (units/day): forecast ${overallMae ?? 'n/a'}, 45-day mean ${baseline45DayMeanMae ?? 'n/a'}, zero-demand ${zeroDemandMae ?? 'n/a'}`,
      '  Per product:',
      ...productLines,
    ].join('\n'),
  );
  return {
    method,
    results,
    overallMae,
    baseline45DayMeanMae,
    zeroDemandMae,
    productsEvaluated: evaluated.length,
    productsInsufficient: results.length - evaluated.length,
  };
};

module.exports = { getForecasts, overview, backtest };
