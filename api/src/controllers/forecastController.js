'use strict';
const service = require('../services/forecastService');
const { sendResponse } = require('../utils/ApiResponse');
const catchAsyncError = require('../middleware/catchAsyncError');
const geminiService = require('../services/geminiService');
const overview = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(await service.overview(req.validatedQuery), 'Forecast overview calculated'),
);
const list = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(
    await service.getForecasts(req.validatedQuery),
    'Product forecasts calculated',
  ),
);
const recommendations = catchAsyncError(async (req, res) => {
  const rows = await service.getForecasts(req.validatedQuery);
  const recommendations = rows
    .filter((row) => row.recommendedRestockQty > 0)
    .sort((a, b) => b.recommendedRestockQty - a.recommendedRestockQty);
  const ai = req.validatedQuery.explain
    ? await geminiService.recommendRestockWithGemini(recommendations)
    : { source: 'not_requested', suggestions: [] };
  const suggestionByProduct = new Map(ai.suggestions.map((item) => [item.productId, item]));
  const orderedRecommendations = ai.suggestions.length
    ? [...recommendations].sort((first, second) => {
        const firstPriority = suggestionByProduct.get(first.product.id)?.priority;
        const secondPriority = suggestionByProduct.get(second.product.id)?.priority;
        return (firstPriority ?? Infinity) - (secondPriority ?? Infinity);
      })
    : recommendations;
  if (req.validatedQuery.explain) {
    console.info(
      '[Forecast] AI restock suggestion response:\n' +
        JSON.stringify(
          {
            source: ai.source,
            model: ['gemini', 'gemini_cache', 'gemini_partial'].includes(ai.source)
              ? process.env.GEMINI_MODEL || 'gemini-3.8-flash'
              : undefined,
            suggestionCount: ai.suggestions.length,
            suggestions: ai.suggestions,
          },
          null,
          2,
        ),
    );
  }
  return sendResponse(res).ok(
    {
      recommendations: orderedRecommendations,
      suggestions: ai.suggestions,
      suggestionSource: ai.source,
    },
    'Restock recommendations calculated',
  );
});
const backtest = catchAsyncError(async (req, res) =>
  sendResponse(res).ok(await service.backtest(), 'Forecast backtest calculated'),
);
module.exports = { overview, list, recommendations, backtest };
