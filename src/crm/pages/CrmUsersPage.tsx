import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download, Loader2, ExternalLink, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CrmStoreUserRow } from "@/lib/api";
import { crmStoreInsightsApi } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

/** Как на странице админки «Пользователи»: 20 строк на страницу. */
const PER_PAGE = 20;

export default function CrmUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-store-users", page, search.trim(), roleFilter],
    queryFn: () =>
      crmStoreInsightsApi.storeUsers({
        page,
        per_page: PER_PAGE,
        search: search.trim() || undefined,
        role: roleFilter,
      }),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const total = meta?.total ?? 0;

  const filtered = rows.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    return true;
  });

  const columns: Column<CrmStoreUserRow>[] = [
    { key: "name", title: "Имя", render: (u) => <span className="font-medium text-sm">{u.name}</span> },
    { key: "email", title: "Email", className: "hidden md:table-cell" },
    { key: "role", title: "Роль", render: (u) => <span className="text-xs capitalize">{u.role}</span> },
    { key: "status", title: "Статус", render: (u) => <StatusBadge status={u.status} /> },
    { key: "orders", title: "Заказы" },
    {
      key: "total_spent",
      title: "Потрачено",
      render: (u) => `${fmt(u.total_spent)} ₽`,
      className: "hidden lg:table-cell",
    },
    { key: "balance", title: "Баланс", render: (u) => `${fmt(u.balance)} ₽`, className: "hidden lg:table-cell" },
    {
      key: "registered_at",
      title: "Регистрация",
      className: "hidden md:table-cell",
      render: (u) => (u.registered_at ? String(u.registered_at).slice(0, 10) : "—"),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Пользователи"
        description={
          isLoading ? "Загрузка…" : `${total} клиентов витрины (users), стр. ${meta?.current_page ?? page} из ${meta?.last_page ?? 1}`
        }
        actions={
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <Download className="h-3.5 w-3.5" /> Экспорт
          </Button>
        }
      />

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex flex-wrap items-center gap-2 justify-between">
        <span>
          Здесь — <strong className="text-foreground">покупатели и роли витрины</strong> (из API <code className="text-xs">/crm/store-users</code>).
          Учётные записи <strong className="text-foreground">панели</strong> (вход в админку, RBAC) — в отдельном разделе.
        </span>
        <Button variant="secondary" size="sm" className="gap-1.5 shrink-0" asChild>
          <Link to="/admin/users">
            Пользователи панели <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить пользователей.
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 font-semibold">
            <Users className="h-5 w-5" />
            Список пользователей витрины
          </CardTitle>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по имени или email…"
                className="pl-8 h-9 text-sm max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-9 w-36 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все роли</SelectItem>
                <SelectItem value="customer">Покупатели</SelectItem>
                <SelectItem value="seller">Продавцы</SelectItem>
                <SelectItem value="moderator">Модераторы</SelectItem>
                <SelectItem value="admin">Админы</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-16 gap-2 text-muted-foreground text-sm items-center">
              <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
            </div>
          ) : (
            <>
              <DataTable data={filtered} columns={columns} onRowClick={(u) => navigate(`/crm/users/${u.id}`)} />
              <p className="text-xs text-muted-foreground mt-3">
                Показано {filtered.length} на странице (всего в базе по фильтру API: {total}). Клик по строке — карточка клиента (те же данные, что и в списке).
              </p>
              {meta && meta.last_page > 1 ? (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Назад
                  </Button>
                  <span className="flex items-center px-2 text-sm text-muted-foreground">
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
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
