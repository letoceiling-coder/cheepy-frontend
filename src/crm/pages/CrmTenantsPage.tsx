import { PermissionGate } from "../rbac/PermissionGate";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Globe, Users, Store, Package, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Tenant } from "../tenant/types";
import { useQuery } from "@tanstack/react-query";
import { crmStoreInsightsApi } from "@/lib/api";

export default function CrmTenantsPage() {
  const q = useQuery({
    queryKey: ["crm-marketplace-tenant"],
    queryFn: () => crmStoreInsightsApi.marketplaceTenant(),
  });

  const tenants: Tenant[] = (q.data?.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    domain: row.domain,
    logo: row.logo,
    currency: row.currency,
    commission: row.commission,
    regions: Array.isArray(row.regions) ? row.regions : [],
    status: row.status === "inactive" ? "inactive" : row.status === "setup" ? "setup" : "active",
    sellersCount: row.sellers_count,
    usersCount: row.users_count,
    productsCount: row.products_count,
    createdAt: String(row.created_at).slice(0, 10),
  }));

  const columns: Column<Tenant>[] = [
    { key: "logo", title: "", className: "w-12", render: (t) => <span className="text-2xl">{t.logo}</span> },
    { key: "name", title: "Маркетплейс", render: (t) => <span className="font-medium text-sm">{t.name}</span> },
    { key: "domain", title: "Домен витрины", render: (t) => <span className="text-sm text-muted-foreground">{t.domain}</span> },
    { key: "status", title: "Статус", render: (t) => <StatusBadge status={t.status} /> },
    { key: "sellersCount", title: "Продавцы", render: (t) => <span className="flex items-center gap-1 text-sm"><Store className="h-3 w-3" />{t.sellersCount}</span> },
    { key: "usersCount", title: "Пользователи", render: (t) => <span className="flex items-center gap-1 text-sm"><Users className="h-3 w-3" />{t.usersCount}</span>, className: "hidden md:table-cell" },
    { key: "productsCount", title: "Товары", render: (t) => <span className="flex items-center gap-1 text-sm"><Package className="h-3 w-3" />{t.productsCount}</span>, className: "hidden lg:table-cell" },
    { key: "commission", title: "Комиссия по ум.", render: (t) => `${t.commission}%` },
    { key: "currency", title: "Валюта", className: "hidden lg:table-cell" },
    {
      key: "slug",
      title: "",
      className: "w-24",
      render: () => (
        <Link to="/crm/settings" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
          <Globe className="h-3 w-3" /> Настройки
        </Link>
      ),
    },
  ];

  return (
    <PermissionGate permission="tenants.manage" showForbidden>
      <div className="space-y-4 animate-fade-in">
        <PageHeader
          title="Маркетплейсы"
          description="Один контур из настроек + реальные счётчики БД (не мульти-сайт)."
          actions={<Button size="sm" className="gap-1.5" variant="outline" asChild><Link to="/crm/settings">Настройки</Link></Button>}
        />

        {q.error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
            Не удалось загрузить карточку маркетплейса.
          </div>
        ) : null}

        {q.isLoading ? (
          <div className="flex justify-center py-24 gap-2 text-muted-foreground text-sm items-center">
            <Loader2 className="h-8 w-8 animate-spin" /> Загрузка…
          </div>
        ) : (
          <DataTable data={tenants} columns={columns} onRowClick={() => { }} />
        )}
      </div>
    </PermissionGate>
  );
}
