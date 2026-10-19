import { apiClient } from "@/lib/api-client";

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface Category {
  id: string;
  name: string;
  productCount?: number;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string | number;
  stockQty: number;
  reorderLevel: number;
  categoryId: string;
  supplierId: string;
  category?: Category;
  supplier?: Supplier;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string | number;
  product?: Product;
}

export interface Sale {
  id: string;
  reference: string;
  status: "pending" | "completed" | "cancelled";
  totalAmount: string | number;
  createdAt: string;
  user?: { id: string; name: string; email: string };
  items: SaleItem[];
}

export interface StockMovement {
  id: string;
  change: number;
  reason: string;
  createdAt: string;
  product?: Product;
  sale?: Pick<Sale, "id" | "reference" | "status">;
}

export interface DashboardOverview {
  totals: {
    products: number;
    categories: number;
    suppliers: number;
    users?: number;
    sales: { pending: number; completed: number; cancelled: number };
  };
  revenue: { completed: number; today: number; todaySales: number };
  inventory: { lowStock: number; outOfStock: number };
  recentSales: Sale[];
  topSellingProducts: {
    productId: string;
    name: string;
    sku: string;
    unitsSold: number;
  }[];
}

export interface Forecast {
  product: {
    id: string;
    name: string;
    sku: string;
    category?: string;
    supplier?: string;
  };
  windowDays: number;
  totalUnitsSold: number;
  averageDailySales: number;
  recent7DayAverage: number;
  forecastHorizonDays: number;
  forecastDemand: number;
  currentStock: number;
  reorderLevel: number;
  estimatedDaysUntilStockout: number | null;
  recommendedRestockQty: number;
  confidence: { quality: string; activeDays: number; coverage: number };
}

const getData = async <T>(path: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get(path, { params });
  return response.data.data as T;
};

const getPage = async <T>(path: string, params?: Record<string, unknown>) => {
  const response = await apiClient.get(path, { params });
  return {
    data: response.data.data as T[],
    meta: response.data.meta as PageMeta,
  };
};

const mutate = async <T>(
  method: "post" | "patch" | "delete",
  path: string,
  input?: unknown,
) => {
  const response =
    method === "delete"
      ? await apiClient.delete(path)
      : method === "patch"
        ? await apiClient.patch(path, input)
        : await apiClient.post(path, input);
  return response.data.data as T;
};

export const listProducts = (params: Record<string, unknown> = {}) =>
  getPage<Product>("/products", { limit: 50, ...params });
export const createProduct = (input: Partial<Product>) =>
  mutate<Product>("post", "/products", input);
export const updateProduct = (id: string, input: Partial<Product>) =>
  mutate<Product>("patch", `/products/${id}`, input);
export const deleteProduct = (id: string) =>
  mutate<void>("delete", `/products/${id}`);
export const adjustStock = (
  id: string,
  change: number,
  reason: "restock" | "adjustment",
) =>
  mutate<Product>("post", `/products/${id}/stock-adjustments`, {
    change,
    reason,
  });
export const getStockSummary = () =>
  getData<{ total: number; lowStock: number; outOfStock: number }>(
    "/products/stock/summary",
  );
export const listLowStock = (params: Record<string, unknown> = {}) =>
  getPage<Product>("/products/stock/low", { limit: 50, ...params });

export const listCategories = (params: Record<string, unknown> = {}) =>
  getPage<Category>("/categories", { limit: 50, ...params });
export const createCategory = (name: string) =>
  mutate<Category>("post", "/categories", { name });
export const updateCategory = (id: string, name: string) =>
  mutate<Category>("patch", `/categories/${id}`, { name });
export const deleteCategory = (id: string) =>
  mutate<void>("delete", `/categories/${id}`);

export const listSuppliers = (params: Record<string, unknown> = {}) =>
  getPage<Supplier>("/suppliers", { limit: 50, ...params });
export const createSupplier = (input: Partial<Supplier>) =>
  mutate<Supplier>("post", "/suppliers", input);
export const updateSupplier = (id: string, input: Partial<Supplier>) =>
  mutate<Supplier>("patch", `/suppliers/${id}`, input);
export const deleteSupplier = (id: string) =>
  mutate<void>("delete", `/suppliers/${id}`);

export const getDashboardOverview = (params?: Record<string, unknown>) =>
  getData<DashboardOverview>("/dashboard/overview", params);
export const getSalesByDay = (params?: Record<string, unknown>) =>
  getData<{ date: string; sales: number; revenue: number }[]>(
    "/dashboard/sales-by-day",
    params,
  );

export const listSales = (params: Record<string, unknown> = {}) =>
  getPage<Sale>("/sales", { limit: 50, ...params });
export const getSaleSummary = (params?: Record<string, unknown>) =>
  getData<Record<string, { count: number; revenue: number }>>(
    "/sales/summary",
    params,
  );
export const createSale = (items: { productId: string; quantity: number }[]) =>
  mutate<Sale>("post", "/sales", { items });
export const completeSale = (id: string) =>
  mutate<Sale>("post", `/sales/${id}/complete`);
export const cancelSale = (id: string) =>
  mutate<Sale>("post", `/sales/${id}/cancel`);

export const listStockMovements = (params: Record<string, unknown> = {}) =>
  getPage<StockMovement>("/stock-movements", { limit: 50, ...params });

export const getForecastOverview = (params?: Record<string, unknown>) =>
  getData<{
    products: number;
    productsAtRisk: number;
    recommendedProducts: number;
    totalRecommendedUnits: number;
    dataQuality: Record<string, number>;
  }>("/forecast/overview", params);
export const listForecasts = (params?: Record<string, unknown>) =>
  getData<Forecast[]>("/forecast/products", params);
export const getRestockRecommendations = (params?: Record<string, unknown>) =>
  getData<{
    recommendations: Forecast[];
    suggestions: {
      productId: string;
      priority: number;
      recommendedRestockQty: number;
      explanation: string;
    }[];
    suggestionSource: string;
  }>("/forecast/restock-recommendations", params);
export const getForecastBacktest = () =>
  getData<{
    method: string;
    results: {
      productId: string;
      name: string;
      status: string;
      mae: number | null;
      baseline45DayMeanMae?: number;
      zeroDemandMae?: number;
      sampleSize: number;
    }[];
    overallMae: number | null;
    productsEvaluated: number;
    productsInsufficient: number;
  }>("/forecast/backtest");

export const uploadFiles = async (files: File[]) => {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));
  const response = await apiClient.post("/uploads", body, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data.data as {
    files: {
      name: string;
      filename: string;
      mimeType: string;
      size: number;
      url: string;
    }[];
  };
};
