import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { CrmStoreUserRow } from "@/lib/api";
import { crmStoreInsightsApi } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);

export default function CrmUsersPage() {
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter] = useState("all");
  const [page] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-store-users", page, appliedSearch, roleFilter],
    queryFn: () =>
      crmStoreInsightsApi.storeUsers({
        page,
        per_page: 50,
        search: appliedSearch.trim() || undefined,
        role: roleFilter,
      }),
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

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
    { key: "total_spent", title: "Потрачено", render: (u) => `${fmt(u.total_spent)} ₽`, className: "hidden lg:table-cell" },
    { key: "balance", title: "Баланс", render: (u) => `${fmt(u.balance)} ₽`, className: "hidden lg:table-cell" },
    { key: "registered_at", title: "Регистрация", className: "hidden md:table-cell", render: (u) => (u.registered_at ? String(u.registered_at).slice(0, 10) : "—") },
  ];

  const applySearch = () => setAppliedSearch(search);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Пользователи"
        description={isLoading ? "Загрузка…" : `${total} записей в базе (витрина)`}
        actions={<Button variant="outline" size="sm" className="gap-1.5" disabled><Download className="h-3.5 w-3.5" /> Экспорт</Button>}
      />

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить пользователей.
        </div>
      ) : null}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            placeholder="Поиск по имени, email, телефону…"
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button type="button" variant="secondary" size="sm" className="h-8" onClick={applySearch}>
          Найти
        </Button>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все роли</SelectItem>
            <SelectItem value="customer">Покупатели</SelectItem>
            <SelectItem value="seller">Продавцы</SelectItem>
            <SelectItem value="moderator">Модераторы</SelectItem>
            <SelectItem value="admin">Админы</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16 gap-2 text-muted-foreground text-sm items-center">
          <Loader2 className="h-5 w-5 animate-spin" /> Загрузка…
        </div>
      ) : (
        <>
          <DataTable data={filtered} columns={columns} onRowClick={(u) => navigate(`/crm/users/${u.id}`)} />
          <p className="text-xs text-muted-foreground">
            Показано {filtered.length} из API (стр. {page}, всего по базе: {total}). Администраторы панели живут в отдельной таблице и здесь не выводятся.
          </p>
        </>
      )}
    </div>
  );
}
