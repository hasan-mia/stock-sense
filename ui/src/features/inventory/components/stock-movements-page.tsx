"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp } from "lucide-react";
import {
  listStockMovements,
  type StockMovement,
} from "@/features/inventory/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

export function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const query = useQuery({
    queryKey: ["movements", "list", page, limit],
    queryFn: () => listStockMovements({ page, limit }),
  });
  const movements = query.data?.data ?? [];
  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "date",
      header: "Date",
      cell: (movement) => new Date(movement.createdAt).toLocaleString(),
    },
    {
      key: "product",
      header: "Product",
      cell: (movement) => (
        <div>
          <div className="font-medium">
            {movement.product?.name ?? "Deleted product"}
          </div>
          <div className="text-xs text-muted-foreground">
            {movement.product?.sku}
          </div>
        </div>
      ),
    },
    {
      key: "change",
      header: "Change",
      cell: (movement) => (
        <span
          className={
            movement.change > 0
              ? "font-medium text-emerald-600"
              : "font-medium text-destructive"
          }
        >
          {movement.change > 0 ? `+${movement.change}` : movement.change}
        </span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      cell: (movement) => (
        <span className="capitalize">
          {movement.reason.replaceAll("_", " ")}
        </span>
      ),
    },
    {
      key: "sale",
      header: "Sale",
      cell: (movement) => movement.sale?.reference ?? "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Stock movements
        </h1>
        <p className="text-sm text-muted-foreground">
          An audit trail of opening stock, restocks, sales and adjustments.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowDownUp className="size-4" />
            Movement history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={movements}
            columns={columns}
            keyExtractor={(movement) => movement.id}
            isLoading={query.isPending}
            error={query.isError ? query.error.message : undefined}
            emptyText="No stock movements recorded."
            pagination={{
              pageSize: limit,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              total: query.data?.meta.total ?? 0,
              serverSide: true,
              onPageChange: setPage,
              onPageSizeChange: (value) => {
                setPage(1);
                setLimit(value);
              },
              position: "bottom",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
