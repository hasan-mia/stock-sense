"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import {
  createCategory,
  createSupplier,
  deleteCategory,
  deleteSupplier,
  listCategories,
  listSuppliers,
  updateCategory,
  updateSupplier,
  type Category,
  type Supplier,
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

type CatalogRow = Category | Supplier;
type CatalogKind = "categories" | "suppliers";

export function CatalogManager({ kind }: { kind: CatalogKind }) {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogRow | null>(null);
  const [rowToDelete, setRowToDelete] = useState<CatalogRow | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const isCategories = kind === "categories";
  const title = isCategories ? "Categories" : "Suppliers";
  const queryKey = [kind, "list"] as const;
  const query = useQuery({
    queryKey: [...queryKey, page, limit],
    queryFn: () =>
      isCategories
        ? listCategories({ page, limit })
        : listSuppliers({ page, limit }),
  });
  const rows = query.data?.data ?? [];

  const save = useMutation({
    mutationFn: async () => {
      if (isCategories) {
        return editing
          ? updateCategory(editing.id, name.trim())
          : createCategory(name.trim());
      }
      const values = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      };
      return editing
        ? updateSupplier(editing.id, values)
        : createSupplier(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`${title.slice(0, -1)} saved`);
      setOpen(false);
      setEditing(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      isCategories ? deleteCategory(id) : deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setRowToDelete(null);
      toast.success(`${title.slice(0, -1)} deleted`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const openForm = (row?: CatalogRow) => {
    setEditing(row ?? null);
    setName(row?.name ?? "");
    setEmail((row && "email" in row ? row.email : "") ?? "");
    setPhone((row && "phone" in row ? row.phone : "") ?? "");
    setOpen(true);
  };

  const columns: DataTableColumn<CatalogRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => <span className="font-medium">{row.name}</span>,
    },
    ...(isCategories
      ? [
          {
            key: "products",
            header: "Products",
            cell: (row: CatalogRow) => (row as Category).productCount ?? 0,
          },
        ]
      : [
          {
            key: "email",
            header: "Email",
            cell: (row: CatalogRow) => (row as Supplier).email || "—",
          },
          {
            key: "phone",
            header: "Phone",
            cell: (row: CatalogRow) => (row as Supplier).phone || "—",
          },
        ]),
    ...(isAdmin
      ? [
          {
            key: "actions",
            header: "Actions",
            align: "right" as const,
            cell: (row: CatalogRow) => (
              <div className="whitespace-nowrap text-right">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${row.name}`}
                  onClick={() => openForm(row)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${row.name}`}
                  onClick={() => setRowToDelete(row)}
                  disabled={remove.isPending}
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
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Organize inventory {isCategories ? "by category" : "suppliers"}.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => openForm()}>
            <Plus className="size-4" />
            Add {title.slice(0, -1).toLowerCase()}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title} directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={rows}
            columns={columns}
            keyExtractor={(row) => row.id}
            isLoading={query.isPending}
            error={query.isError ? query.error.message : undefined}
            emptyText={`No ${title.toLowerCase()} yet.`}
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

      <ConfirmDialog
        open={Boolean(rowToDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !remove.isPending) setRowToDelete(null);
        }}
        title={`Delete ${title.slice(0, -1).toLowerCase()}?`}
        description={`Delete ${rowToDelete?.name ?? "this record"}? This action cannot be undone.`}
        confirmLabel={`Delete ${title.slice(0, -1).toLowerCase()}`}
        isPending={remove.isPending}
        onConfirm={() => {
          if (rowToDelete) remove.mutate(rowToDelete.id);
        }}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "Add"} {title.slice(0, -1).toLowerCase()}
            </DialogTitle>
            <DialogDescription>
              Save the details for this {title.slice(0, -1).toLowerCase()}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="catalog-name">Name</Label>
              <Input
                id="catalog-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={150}
              />
            </div>
            {!isCategories && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="catalog-email">Email</Label>
                  <Input
                    id="catalog-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="catalog-phone">Phone</Label>
                  <Input
                    id="catalog-phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                  />
                </div>
              </>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
