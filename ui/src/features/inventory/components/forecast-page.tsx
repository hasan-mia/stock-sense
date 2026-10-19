"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/store";
import {
  getForecastBacktest,
  getForecastOverview,
  getRestockRecommendations,
  listForecasts,
} from "@/features/inventory/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ForecastPage() {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [explain, setExplain] = useState(false);
  const overview = useQuery({
    queryKey: ["forecast", "overview"],
    queryFn: () => getForecastOverview(),
  });
  const recommendations = useQuery({
    queryKey: ["forecast", "recommendations", explain],
    queryFn: () => getRestockRecommendations({ explain }),
  });
  const forecasts = useQuery({
    queryKey: ["forecast", "products"],
    queryFn: () => listForecasts(),
  });
  const backtest = useQuery({
    queryKey: ["forecast", "backtest"],
    queryFn: getForecastBacktest,
    enabled: false,
  });
  const metrics = overview.data;
  const recs = recommendations.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Demand forecast
          </h1>
          <p className="text-sm text-muted-foreground">
            Recent sales drive restock guidance and estimated stockout timing.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={explain}
            onChange={(event) => setExplain(event.target.checked)}
          />
          AI restock suggestions
        </label>
      </div>
      {overview.isError && (
        <Card>
          <CardContent className="py-5 text-sm text-destructive">
            {overview.error.message}
          </CardContent>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { name: "Products analyzed", value: metrics?.products },
          { name: "At stockout risk", value: metrics?.productsAtRisk },
          { name: "Need restocking", value: metrics?.recommendedProducts },
          { name: "Recommended units", value: metrics?.totalRecommendedUnits },
        ].map((item) => (
          <Card key={item.name}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{item.name}</p>
              {overview.isPending ? (
                <Skeleton className="mt-2 h-8 w-20" />
              ) : (
                <p className="mt-1 text-2xl font-semibold">{item.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Restock recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendations.isPending ? (
            <Skeleton className="h-40" />
          ) : recommendations.isError ? (
            <p className="py-8 text-sm text-destructive">
              {recommendations.error.message}
            </p>
          ) : !recs?.recommendations.length ? (
            <p className="py-8 text-sm text-muted-foreground">
              No products need restocking right now.
            </p>
          ) : (
            <div className="space-y-3">
              {recs.recommendations.map((row) => {
                const suggestion = recs.suggestions.find(
                  (item) => item.productId === row.product.id,
                );
                return (
                  <div
                    key={row.product.id}
                    className="flex flex-col justify-between gap-2 rounded-lg border p-4 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-medium">
                        {row.product.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          {row.product.sku}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stock: {row.currentStock} · Last 7-day avg demand:{" "}
                        {row.recent7DayAverage.toFixed(2)}/day · Historical avg
                        ({row.windowDays} days):{" "}
                        {row.averageDailySales.toFixed(2)}/day · Stockout
                        estimate:{" "}
                        {row.estimatedDaysUntilStockout === null
                          ? "Unavailable (no recent demand)"
                          : `${row.estimatedDaysUntilStockout} days`}
                      </p>
                      {suggestion && (
                        <div className="mt-2 space-y-1 text-sm">
                          <p className="font-medium text-primary">
                            AI priority #{suggestion.priority} · AI suggests{" "}
                            {suggestion.recommendedRestockQty} units
                          </p>
                          <p>{suggestion.explanation}</p>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-xs text-muted-foreground">
                        Calculated restock
                      </p>
                      <p className="text-2xl font-semibold">
                        {row.recommendedRestockQty}
                      </p>
                    </div>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Suggestion source: {recs.suggestionSource}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product demand outlook</CardTitle>
        </CardHeader>
        <CardContent>
          {forecasts.isPending ? (
            <Skeleton className="h-40" />
          ) : forecasts.isError ? (
            <p className="py-6 text-sm text-destructive">
              {forecasts.error.message}
            </p>
          ) : (
            <div className="space-y-3">
              {forecasts.data.map((forecast) => (
                <div
                  key={forecast.product.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {forecast.product.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        {forecast.product.sku}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Average {forecast.averageDailySales.toFixed(2)} / day ·
                      Recent {forecast.recent7DayAverage.toFixed(2)} / day
                    </p>
                  </div>
                  <div className="flex gap-5 text-sm">
                    <span>
                      Projected:{" "}
                      <strong>{forecast.forecastDemand.toFixed(1)}</strong>
                    </span>
                    <span>
                      Stockout:{" "}
                      <strong>
                        {forecast.estimatedDaysUntilStockout === null
                          ? "Unavailable"
                          : `${forecast.estimatedDaysUntilStockout} days`}
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Forecast backtest</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Compare the recent 7-day method against historical-mean and
                zero-demand baselines.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => backtest.refetch()}
              disabled={backtest.isFetching}
            >
              {backtest.isFetching ? "Running…" : "Run backtest"}
            </Button>
          </CardHeader>
          <CardContent>
            {backtest.data && (
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">Forecast MAE</p>
                  <p className="text-xl font-semibold">
                    {backtest.data.overallMae ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Products evaluated
                  </p>
                  <p className="text-xl font-semibold">
                    {backtest.data.productsEvaluated}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Insufficient history
                  </p>
                  <p className="text-xl font-semibold">
                    {backtest.data.productsInsufficient}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
