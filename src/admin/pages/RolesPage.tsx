import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShieldCheck, Plus, Edit, Trash2, Loader2, Users } from "lucide-react";
import { adminRolesApi, type RoleRecord } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const permissions = ["Парсер", "Объявления", "Категории", "AI", "Планировщик", "Логи", "Настройки", "Роли"];
const rolePerms: Record<string, boolean[]> = {
  admin: [true, true, true, true, true, true, true, true],
  editor: [false, true, true, true, false, true, false, false],
  viewer: [false, true, false, false, false, false, false, false],
};

export default function RolesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [form, setForm] = useState({ name: "", slug: "" });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: () => adminRolesApi.list({ per_page: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: adminRolesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setDialogOpen(false);
      setForm({ name: "", slug: "" });
      toast.success("Роль создана");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string; slug: string } }) =>
      adminRolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setDialogOpen(false);
      setEditingRole(null);
      setForm({ name: "", slug: "" });
      toast.success("Роль обновлена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });
  const deleteMutation = useMutation({
    mutationFn: adminRolesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Роль удалена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка"),
  });

  const openCreate = () => {
    setForm({ name: "", slug: "" });
    setEditingRole(null);
    setDialogOpen(true);
  };
  const openEdit = (r: RoleRecord) => {
    setForm({ name: r.name, slug: r.slug });
    setEditingRole(r);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Заполните название и slug");
      return;
    }
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleDelete = (r: RoleRecord) => {
    if (!confirm(`Удалить роль "${r.name}"?`)) return;
    deleteMutation.mutate(r.id);
  };

  const roles = data?.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Роли и доступ</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/users")}>
            <Users className="h-4 w-4 mr-1" />
            Пользователи
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить роль
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Роли RBAC
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm mb-4">{(error as Error).message}</p>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Пользователей</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.slug}</Badge>
                    </TableCell>
                    <TableCell>{r.users_count ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(r)}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Матрица прав по умолчанию</CardTitle>
          <p className="text-sm text-muted-foreground">
            Права по умолчанию для встроенных ролей (admin, editor, viewer)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Модуль</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Editor</TableHead>
                <TableHead>Viewer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissions.map((p, i) => (
                <TableRow key={p}>
                  <TableCell className="font-medium">{p}</TableCell>
                  {(["admin", "editor", "viewer"] as const).map((role) => (
                    <TableCell key={role}>
                      <span
                        className={
                          (rolePerms[role]?.[i] ? "text-emerald-600" : "text-destructive")
                        }
                      >
                        {rolePerms[role]?.[i] ? "✓" : "✗"}
                      </span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRole ? "Редактировать роль" : "Новая роль"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Название</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Administrator"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  }))
                }
                placeholder="admin"
                disabled={!!editingRole}
              />
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
                !form.slug.trim()
              }
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingRole ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
