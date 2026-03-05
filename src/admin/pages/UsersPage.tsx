import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { adminUsersApi, adminRolesApi, type AdminUserRecord } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const roleBadge = (role: string) => {
  const m: Record<string, string> = {
    admin: "bg-destructive/10 text-destructive",
    editor: "bg-amber-100 text-amber-800",
    viewer: "bg-muted text-muted-foreground",
  };
  return <Badge className={m[role] ?? "bg-muted"}>{role}</Badge>;
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "editor" as "admin" | "editor" | "viewer",
    is_active: true,
    role_ids: [] as number[],
  });

  const { data: rolesData } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => adminRolesApi.list({ per_page: 100 }),
  });
  const roles = rolesData?.data ?? [];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", search, page],
    queryFn: () => adminUsersApi.list({ search: search || undefined, page, per_page: 20 }),
  });

  const createMutation = useMutation({
    mutationFn: adminUsersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      resetForm();
      toast.success("Пользователь создан");
    },
    onError: (e: Error & { errors?: Record<string, string[]> }) => {
      toast.error(e.message || "Ошибка");
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof adminUsersApi.update>[1] }) =>
      adminUsersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setDialogOpen(false);
      setEditingUser(null);
      resetForm();
      toast.success("Пользователь обновлён");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
  const deleteMutation = useMutation({
    mutationFn: adminUsersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Пользователь удалён");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });

  const resetForm = () =>
    setForm({
      name: "",
      email: "",
      password: "",
      role: "editor",
      is_active: true,
      role_ids: [],
    });

  const openCreate = () => {
    resetForm();
    setEditingUser(null);
    setDialogOpen(true);
  };
  const openEdit = (u: AdminUserRecord) => {
    setForm({
      name: u.name,
      email: u.email,
      password: "",
      role: (u.role as "admin" | "editor" | "viewer") || "editor",
      is_active: u.is_active,
      role_ids: u.roles?.map((r) => r.id) ?? [],
    });
    setEditingUser(u);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Заполните имя и email");
      return;
    }
    if (!editingUser && !form.password) {
      toast.error("Введите пароль");
      return;
    }
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          name: form.name,
          email: form.email,
          role: form.role,
          is_active: form.is_active,
          role_ids: form.role_ids,
          ...(form.password ? { password: form.password } : {}),
        },
      });
    } else {
      createMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        is_active: form.is_active,
        role_ids: form.role_ids,
      });
    }
  };

  const handleDelete = (u: AdminUserRecord) => {
    if (!confirm(`Удалить пользователя ${u.name}?`)) return;
    deleteMutation.mutate(u.id);
  };

  const users = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Пользователи</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Добавить пользователя
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Список пользователей
          </CardTitle>
          <div className="pt-2">
            <Input
              placeholder="Поиск по имени или email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm mb-4">
              {(error as Error).message}
            </p>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Роли (RBAC)</TableHead>
                  <TableHead>Активен</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{roleBadge(u.role)}</TableCell>
                    <TableCell>
                      {u.roles?.length
                        ? u.roles.map((r) => (
                            <Badge key={r.id} variant="outline" className="mr-1">
                              {r.slug}
                            </Badge>
                          ))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={u.is_active}
                        onCheckedChange={() =>
                          updateMutation.mutate({
                            id: u.id,
                            data: { is_active: !u.is_active },
                          })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {meta && meta.last_page > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Назад
              </Button>
              <span className="flex items-center px-2">
                {meta.current_page} / {meta.last_page}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Редактировать пользователя" : "Новый пользователь"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Имя</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Имя"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Пароль {editingUser && "(оставьте пустым, чтобы не менять)"}
              </label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editingUser ? "Новый пароль" : "Пароль"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Роль</label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, role: v as "admin" | "editor" | "viewer" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">admin</SelectItem>
                  <SelectItem value="editor">editor</SelectItem>
                  <SelectItem value="viewer">viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {roles.length > 0 && (
              <div>
                <label className="text-sm font-medium">Роли RBAC</label>
                <div className="flex flex-wrap gap-4 mt-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={form.role_ids.includes(r.id)}
                        onCheckedChange={(checked) =>
                          setForm((f) => ({
                            ...f,
                            role_ids: checked
                              ? [...f.role_ids, r.id]
                              : f.role_ids.filter((id) => id !== r.id),
                          }))
                        }
                      />
                      {r.name} ({r.slug})
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
              <label className="text-sm">Активен</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                !form.name.trim() ||
                !form.email.trim() ||
                (!editingUser && !form.password)
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingUser ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
