import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { crmStoreInsightsApi, ApiError } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

function formatDateRu(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function CrmUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const userId = id?.trim() ?? "";

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["crm-store-user", userId],
    queryFn: () => crmStoreInsightsApi.storeUser(userId),
    enabled: Boolean(userId),
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Не указан пользователь</h2>
          <Link to="/crm/users" className="text-sm text-primary hover:underline">
            ← Вернуться к пользователям
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 gap-2 text-muted-foreground text-sm items-center">
        <Loader2 className="h-6 w-6 animate-spin" /> Загрузка профиля…
      </div>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Пользователь не найден</h2>
          <Link to="/crm/users" className="text-sm text-primary hover:underline">
            ← Вернуться к пользователям
          </Link>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 max-w-md px-4">
          <h2 className="text-xl font-semibold">Не удалось загрузить профиль</h2>
          <p className="text-sm text-muted-foreground">
            {(error as Error)?.message || "Неизвестная ошибка"}
          </p>
          <Link to="/crm/users" className="text-sm text-primary hover:underline inline-block pt-2">
            ← Вернуться к пользователям
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/crm/users">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={user.name || "Без имени"}
          description={`ID: ${user.id} · ${user.email}`}
          actions={<StatusBadge status={user.status} />}
        />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Профиль</TabsTrigger>
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="finance">Финансы</TabsTrigger>
          <TabsTrigger value="activity">Активность</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Контактные данные</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span> {user.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Телефон:</span> {user.phone || "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Роль:</span>{" "}
                  <span className="capitalize">{user.role}</span>
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Регистрация</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Дата:</span>{" "}
                  {formatDateRu(user.registered_at)}
                </p>
                <p>
                  <span className="text-muted-foreground">Последняя активность:</span>{" "}
                  {formatDateRu(user.last_active)}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 text-center">
            <p className="text-3xl font-semibold">{user.orders}</p>
            <p className="text-sm text-muted-foreground mt-1">Заказов оформлено (по данным витрины)</p>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <p className="text-2xl font-semibold">{fmt(user.total_spent)}</p>
              <p className="text-xs text-muted-foreground">Потрачено (₽)</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 text-center">
              <p className="text-2xl font-semibold">{fmt(user.balance)}</p>
              <p className="text-xs text-muted-foreground">Бонусный / внутренний баланс (₽)</p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Регистрация</span>
              <span className="text-xs text-muted-foreground ml-auto">{formatDateRu(user.registered_at)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span>Последняя активность</span>
              <span className="text-xs text-muted-foreground ml-auto">{formatDateRu(user.last_active)}</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
