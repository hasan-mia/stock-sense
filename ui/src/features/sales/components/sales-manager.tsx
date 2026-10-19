"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import {
  cancelSale,
  completeSale,
  createSale,
  getSaleSummary,
  listProducts,
  listSales,
  type Sale,
} from "@/features/inventory/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

const currency = (amount: string | number) =>
  Number(amount).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

export function SalesManager() {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const sales = useQuery({
    queryKey: ["sales", "list", page, limit],
    queryFn: () => listSales({ page, limit }),
  });
  const summary = useQuery({
    queryKey: ["sales", "summary"],
    queryFn: () => getSaleSummary(),
  });
  const products = useQuery({
    queryKey: ["products", "list"],
    queryFn: () => listProducts(),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["movements"] });
    queryClient.invalidateQueries({ queryKey: ["forecast"] });
  };
  const create = useMutation({
    mutationFn: () => createSale(items),
    onSuccess: () => {
      refresh();
      setOpen(false);
      setItems([]);
      toast.success("Sale created. Complete it to deduct stock.");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const complete = useMutation({
    mutationFn: completeSale,
    onSuccess: () => {
      refresh();
      toast.success("Sale completed and stock deducted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const cancel = useMutation({
    mutationFn: cancelSale,
    onSuccess: () => {
      refresh();
      setSaleToCancel(null);
      toast.success("Sale cancelled");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const addItem = () => {
    if (!productId || Number(quantity) < 1) return;
    if (items.some((item) => item.productId === productId)) {
      toast.error("That product is already in this sale");
      return;
    }
    setItems((current) => [
      ...current,
      { productId, quantity: Number(quantity) },
    ]);
    setProductId("");
    setQuantity("1");
  };
  const productName = (id: string) =>
    products.data?.data.find((product) => product.id === id)?.name ?? id;
  const rows = sales.data?.data ?? [];
  const statuses = ["pending", "completed", "cancelled"] as const;
  const columns: DataTableColumn<Sale>[] = [
    {
      key: "reference",
      header: "Reference",
      cell: (sale) => (
        <div>
          <div className="font-medium">{sale.reference}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(sale.createdAt).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: "user",
      header: "Created by",
      cell: (sale) => sale.user?.name ?? "—",
    },
    {
      key: "items",
      header: "Items",
      cell: (sale) =>
        sale.items
          ?.map(
            (item) => `${item.product?.name ?? "Product"} × ${item.quantity}`,
          )
          .join(", ") || "—",
    },
    {
      key: "total",
      header: "Total",
      cell: (sale) => currency(sale.totalAmount),
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
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (sale) => {
        const canCancel =
          sale.status === "pending" || (sale.status === "completed" && isAdmin);
        const busy = complete.isPending || cancel.isPending;
        return (
          <div className="flex justify-end gap-2 whitespace-nowrap">
            {sale.status === "pending" && (
              <Button
                size="sm"
                onClick={() => complete.mutate(sale.id)}
                disabled={busy}
              >
                Complete
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSaleToCancel(sale)}
                disabled={busy}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales</h1>
          <p className="text-sm text-muted-foreground">
            Create sales, complete checkout and review revenue.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          New sale
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {statuses.map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-sm capitalize text-muted-foreground">
                {status}
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {summary.data?.[status]?.count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {currency(summary.data?.[status]?.revenue ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="size-4" />
            Sales history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rows}
            columns={columns}
            keyExtractor={(sale) => sale.id}
            isLoading={sales.isPending}
            error={sales.isError ? sales.error.message : undefined}
            emptyText="No sales yet. Create a sale to get started."
            pagination={{
              pageSize: limit,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              total: sales.data?.meta.total ?? 0,
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
      <ConfirmDialog
        open={Boolean(saleToCancel)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !cancel.isPending) setSaleToCancel(null);
        }}
        title="Cancel this sale?"
        description={
          saleToCancel?.status === "completed"
            ? `Cancel ${saleToCancel.reference}? Its sold units will be returned to inventory.`
            : `Cancel ${saleToCancel?.reference ?? "this pending sale"}?`
        }
        confirmLabel="Cancel sale"
        isPending={cancel.isPending}
        onConfirm={() => {
          if (saleToCancel) cancel.mutate(saleToCancel.id);
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] gap-6 overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle>Create sale</DialogTitle>
            <DialogDescription>
              New sales start pending. Stock changes only when completed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
            <div className="grid gap-1.5">
              <Label htmlFor="sale-product">Product</Label>
              <select
                id="sale-product"
                className="h-9 rounded-lg border bg-background px-2 text-sm"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="">Choose product</option>
                {products.data?.data.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {product.stockQty} in stock
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="sale-quantity">Quantity</Label>
              <Input
                id="sale-quantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              disabled={!productId}
            >
              Add
            </Button>
          </div>
          {items.length > 0 && (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border bg-muted/20 p-3">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"
                >
                  <span>
                    {productName(item.productId)} × {item.quantity}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setItems((current) =>
                        current.filter(
                          (row) => row.productId !== item.productId,
                        ),
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Close
            </Button>
            <Button
              disabled={!items.length || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? "Creating…" : "Create pending sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
