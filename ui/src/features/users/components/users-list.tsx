"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { deleteUser, listUsers, type User } from "@/features/users/api";
import { UserFormDialog } from "@/features/users/components/user-form-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";

export function UsersList() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | undefined>();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const query = useQuery({
    queryKey: ["users", page, limit],
    queryFn: () => listUsers(page, limit),
  });
  const remove = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setUserToDelete(null);
      toast.success("User deleted");
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };
  const openEdit = (user: User) => {
    setEditing(user);
    setDialogOpen(true);
  };
  const columns: DataTableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      cell: (user) => <span className="font-medium">{user.name}</span>,
    },
    { key: "email", header: "Email", cell: (user) => user.email },
    {
      key: "role",
      header: "Role",
      cell: (user) => (
        <span className="rounded-full bg-muted px-2 py-1 text-xs capitalize">
          {user.role}
        </span>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      cell: (user) =>
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—",
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (user) => (
        <div className="whitespace-nowrap text-right">
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Edit ${user.name}`}
            onClick={() => openEdit(user)}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={`Delete ${user.name}`}
            disabled={user.id === currentUserId || remove.isPending}
            onClick={() => setUserToDelete(user)}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            Manage administrators and staff accounts.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add user
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            Team members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={query.data?.data ?? []}
            columns={columns}
            keyExtractor={(user) => user.id}
            isLoading={query.isPending}
            error={query.isError ? query.error.message : undefined}
            emptyText="No users found."
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
        open={Boolean(userToDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !remove.isPending) setUserToDelete(null);
        }}
        title="Delete user?"
        description={`Delete ${userToDelete?.name ?? "this user"}'s account? They will lose access to Stock Sense.`}
        confirmLabel="Delete user"
        isPending={remove.isPending}
        onConfirm={() => {
          if (userToDelete) remove.mutate(userToDelete.id);
        }}
      />
      <UserFormDialog
        key={editing?.id ?? "new-user"}
        user={editing}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
