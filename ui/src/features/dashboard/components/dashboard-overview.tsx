"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  ChartNoAxesCombined,
  DollarSign,
  ShoppingCart,
  Truck,
} from "lucide-react";
import {
  getDashboardOverview,
  getSalesByDay,
  getStockSummary,
  type Sale,
} from "@/features/inventory/api";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const currency = (amount: number) =>
  amount.toLocaleString(undefined, { style: "currency", currency: "USD" });

export function DashboardOverview() {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const firstDay = new Date(today);
  firstDay.setUTCDate(firstDay.getUTCDate() - 6);
  const from = firstDay.toISOString().slice(0, 10);
  const overview = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: () => getDashboardOverview(),
  });
  const salesByDay = useQuery({
    queryKey: ["dashboard", "sales-by-day", from, to],
    queryFn: () => getSalesByDay({ from, to }),
  });
  const stock = useQuery({
    queryKey: ["products", "stock-summary"],
    queryFn: getStockSummary,
  });
  const stats = overview.data;
  const recentSalesColumns: DataTableColumn<Sale>[] = [
    {
      key: "reference",
      header: "Sale",
      cell: (sale) => <span className="font-medium">{sale.reference}</span>,
    },
    {
      key: "user.name",
      header: "Created by",
      cell: (sale) => sale.user?.name ?? "Staff",
    },
    {
      key: "createdAt",
      header: "Date",
      cell: (sale) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {new Date(sale.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      align: "right",
      cell: (sale) => currency(Number(sale.totalAmount)),
    },
    {
      key: "status",
      header: "Status",
      cell: (sale) => (
        <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
          {sale.status}
        </span>
      ),
    },
  ];
  const cards = [
    {
      label: "Products",
      value: stats?.totals.products,
      icon: Boxes,
      href: "/dashboard/products",
    },
    {
      label: "Low stock",
      value: stock.data?.lowStock ?? stats?.inventory.lowStock,
      icon: AlertTriangle,
      href: "/dashboard/products?lowStock=true",
    },
    {
      label: "Sales today",
      value: stats?.revenue.todaySales,
      icon: ShoppingCart,
      href: "/dashboard/sales",
    },
    {
      label: "Revenue today",
      value: stats ? currency(stats.revenue.today) : undefined,
      icon: DollarSign,
      href: "/dashboard/sales",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Stock Sense</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Inventory overview
          </h1>
          <p className="text-sm text-muted-foreground">
            A live view of stock, sales and replenishment.
          </p>
        </div>
        <Button render={<Link href="/dashboard/sales" />}>Create a sale</Button>
      </div>
      {overview.isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {overview.error.message}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map(({ label, value, icon: Icon, href }) => (
            <Link key={label} href={href}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {overview.isPending ? (
                      <Skeleton className="mt-2 h-8 w-24" />
                    ) : (
                      <p className="mt-1 text-2xl font-semibold">
                        {value ?? 0}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-primary/10 p-3 text-primary">
                    <Icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent sales</CardTitle>
          </CardHeader>
          <CardContent className="px-4">
            <DataTable
              data={stats?.recentSales ?? []}
              columns={recentSalesColumns}
              keyExtractor={(sale) => sale.id}
              isLoading={overview.isPending}
              emptyText="No sales yet."
              pagination={{
                pageSize: 8,
                pageSizeOptions: [8],
                showSizeChanger: false,
                infiniteScroll: true,
              }}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ChartNoAxesCombined className="size-4" />
              Inventory health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stock.isPending ? (
              <Skeleton className="h-32" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total units tracked
                  </span>
                  <strong>{stock.data?.total ?? 0}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Low stock
                  </span>
                  <strong className="text-amber-600">
                    {stock.data?.lowStock ?? 0}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Out of stock
                  </span>
                  <strong className="text-destructive">
                    {stock.data?.outOfStock ?? 0}
                  </strong>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  render={<Link href="/dashboard/forecast" />}
                >
                  Review forecast
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Sales by day · last 7 days
          </CardTitle>
        </CardHeader>
        <CardContent>
          {salesByDay.isPending ? (
            <Skeleton className="h-32" />
          ) : salesByDay.isError ? (
            <p className="text-sm text-destructive">
              {salesByDay.error.message}
            </p>
          ) : salesByDay.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No completed sales in this period.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
              {salesByDay.data.map((day) => (
                <div key={day.date} className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString(
                      undefined,
                      { weekday: "short", month: "short", day: "numeric" },
                    )}
                  </p>
                  <p className="mt-2 font-semibold">{currency(day.revenue)}</p>
                  <p className="text-xs text-muted-foreground">
                    {day.sales} sales
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="size-4" />
            Top selling products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(stats?.topSellingProducts.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">
              Completed sales will appear here.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {stats?.topSellingProducts.map((product) => (
                <div key={product.productId} className="rounded-lg border p-3">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <p className="mt-2 text-sm">{product.unitsSold} units sold</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
