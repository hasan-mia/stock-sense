"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import {
  createProduct,
  deleteProduct,
  listCategories,
  listLowStock,
  listProducts,
  listSuppliers,
  updateProduct,
  adjustStock,
  type Product,
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

type ProductForm = {
  name: string;
  sku: string;
  price: string;
  stockQty: string;
  reorderLevel: string;
  categoryId: string;
  supplierId: string;
};
const emptyForm: ProductForm = {
  name: "",
  sku: "",
  price: "",
  stockQty: "0",
  reorderLevel: "0",
  categoryId: "",
  supplierId: "",
};
const money = (value: string | number) =>
  Number(value).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });

export function ProductsManager() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToRestock, setProductToRestock] = useState<Product | null>(
    null,
  );
  const [restockAmount, setRestockAmount] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const products = useQuery({
    queryKey: ["products", "list", lowStockOnly, page, limit],
    queryFn: () =>
      lowStockOnly
        ? listLowStock({ page, limit })
        : listProducts({ page, limit }),
  });
  const categories = useQuery({
    queryKey: ["categories", "list"],
    queryFn: () => listCategories(),
  });
  const suppliers = useQuery({
    queryKey: ["suppliers", "list"],
    queryFn: () => listSuppliers(),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["movements"] });
    queryClient.invalidateQueries({ queryKey: ["forecast"] });
  };

  const save = useMutation({
    mutationFn: () => {
      const input = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        price: Number(form.price),
        reorderLevel: Number(form.reorderLevel),
        categoryId: form.categoryId,
        supplierId: form.supplierId,
      };
      return editing
        ? updateProduct(editing.id, input)
        : createProduct({ ...input, stockQty: Number(form.stockQty) });
    },
    onSuccess: () => {
      refresh();
      toast.success("Product saved");
      setOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      refresh();
      setProductToDelete(null);
      toast.success("Product deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const stockChange = useMutation({
    mutationFn: ({ id, change }: { id: string; change: number }) =>
      adjustStock(id, change, "restock"),
    onSuccess: () => {
      refresh();
      setProductToRestock(null);
      setRestockAmount("");
      toast.success("Stock updated");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const set = (key: keyof ProductForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => {
    setForm(emptyForm);
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (product: Product) => {
    setForm({
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      stockQty: String(product.stockQty),
      reorderLevel: String(product.reorderLevel),
      categoryId: product.categoryId,
      supplierId: product.supplierId,
    });
    setEditing(product);
    setOpen(true);
  };

  const columns: DataTableColumn<Product>[] = [
    {
      key: "product",
      header: "Product",
      cell: (product) => (
        <div>
          <div className="font-medium">{product.name}</div>
          <div className="text-xs text-muted-foreground">{product.sku}</div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (product) => product.category?.name ?? "—",
    },
    {
      key: "supplier",
      header: "Supplier",
      cell: (product) => product.supplier?.name ?? "—",
    },
    { key: "price", header: "Price", cell: (product) => money(product.price) },
    {
      key: "stock",
      header: "Stock",
      cell: (product) => (
        <>
          <span
            className={
              product.stockQty <= product.reorderLevel
                ? "font-medium text-amber-600"
                : ""
            }
          >
            {product.stockQty}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">
            / reorder {product.reorderLevel}
          </span>
        </>
      ),
    },
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "Actions",
            align: "right" as const,
            cell: (product: Product) => (
              <div className="whitespace-nowrap text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Restock"
                  onClick={() => {
                    setProductToRestock(product);
                    setRestockAmount("");
                  }}
                >
                  <RefreshCw className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit product"
                  onClick={() => openEdit(product)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete product"
                  onClick={() => setProductToDelete(product)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {lowStockOnly ? "Low stock" : "Products"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Catalog, availability and stock levels.
          </p>
        </div>
        {lowStockOnly && (
          <Button
            variant="outline"
            onClick={() => {
              setPage(1);
              router.replace("/dashboard/products");
            }}
          >
            Show all products
          </Button>
        )}
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add product
          </Button>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={products.data?.data ?? []}
            columns={columns}
            keyExtractor={(product) => product.id}
            isLoading={products.isPending}
            error={products.isError ? products.error.message : undefined}
            emptyText="No products found."
            pagination={{
              pageSize: limit,
              pageSizeOptions: [10, 20, 50, 100],
              showSizeChanger: true,
              total: products.data?.meta.total ?? 0,
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
      <Dialog
        open={Boolean(productToRestock)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !stockChange.isPending) setProductToRestock(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restock product</DialogTitle>
            <DialogDescription>
              Add units to {productToRestock?.name}. This change will be added
              to the stock movement history.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              const amount = Number(restockAmount);
              if (!productToRestock || !Number.isInteger(amount) || amount < 1)
                return;
              stockChange.mutate({ id: productToRestock.id, change: amount });
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="restock-amount">Units to add</Label>
              <Input
                id="restock-amount"
                type="number"
                min="1"
                step="1"
                autoFocus
                value={restockAmount}
                onChange={(event) => setRestockAmount(event.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductToRestock(null)}
                disabled={stockChange.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={stockChange.isPending}>
                {stockChange.isPending ? "Saving…" : "Add stock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={Boolean(productToDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !remove.isPending) setProductToDelete(null);
        }}
        title="Delete product?"
        description={`This will delete ${productToDelete?.name ?? "this product"}. Products with sales or stock history cannot be deleted.`}
        confirmLabel="Delete product"
        isPending={remove.isPending}
        onConfirm={() => {
          if (productToDelete) remove.mutate(productToDelete.id);
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit product" : "Add product"}
            </DialogTitle>
            <DialogDescription>
              Inventory quantity is tracked with stock movements.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>SKU</Label>
              <Input
                value={form.sku}
                onChange={(event) => set("sku", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Unit price</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
                required
              />
            </div>
            {!editing && (
              <div className="grid gap-1.5">
                <Label>Opening stock</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockQty}
                  onChange={(event) => set("stockQty", event.target.value)}
                  required
                />
              </div>
            )}
            <div className="grid gap-1.5">
              <Label>Reorder level</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={form.reorderLevel}
                onChange={(event) => set("reorderLevel", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Category</Label>
              <select
                className="h-9 rounded-lg border bg-background px-2 text-sm"
                value={form.categoryId}
                onChange={(event) => set("categoryId", event.target.value)}
                required
              >
                <option value="">Choose category</option>
                {categories.data?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Supplier</Label>
              <select
                className="h-9 rounded-lg border bg-background px-2 text-sm"
                value={form.supplierId}
                onChange={(event) => set("supplierId", event.target.value)}
                required
              >
                <option value="">Choose supplier</option>
                {suppliers.data?.data.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  save.isPending ||
                  !categories.data?.data.length ||
                  !suppliers.data?.data.length
                }
              >
                {save.isPending ? "Saving…" : "Save product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
