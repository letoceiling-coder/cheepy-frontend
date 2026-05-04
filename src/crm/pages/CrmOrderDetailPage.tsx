import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Printer } from "lucide-react";
import { PermissionGate } from "../rbac/PermissionGate";
import { crmCommerceApi } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

export default function CrmOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? Number.parseInt(id, 10) : NaN;

  const q = useQuery({
    queryKey: ["crm", "store-order", orderId],
    queryFn: () => crmCommerceApi.storeOrder(orderId),
    enabled: Number.isFinite(orderId),
    staleTime: 30_000,
  });

  if (!Number.isFinite(orderId)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Некорректный номер заказа</h2>
          <Link to="/crm/orders" className="text-sm text-primary hover:underline">
            ← Назад к заказам
          </Link>
        </div>
      </div>
    );
  }

  if (q.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-sm text-muted-foreground">
        Загрузка заказа #{orderId}…
      </div>
    );
  }

  if (q.error || !q.data?.data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">Заказ не найден</h2>
          <p className="text-sm text-destructive">{(q.error as Error)?.message}</p>
          <Link to="/crm/orders" className="text-sm text-primary hover:underline">
            ← Назад к заказам
          </Link>
        </div>
      </div>
    );
  }

  const order = q.data.data;
  const created = order.created_at ? new Date(order.created_at).toLocaleString("ru-RU") : "—";
  const timeline = [
    { label: "Создан", date: order.created_at ? new Date(order.created_at).toLocaleString("ru-RU") : null },
    { label: "Оплачен", date: order.paid_at ? new Date(order.paid_at).toLocaleString("ru-RU") : null },
    { label: `Статус: ${order.status}`, date: order.updated_at ? new Date(order.updated_at).toLocaleString("ru-RU") : null },
  ];

  const snap = order.delivery_snapshot ?? {};

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div className="flex items-center gap-3">
        <Link to="/crm/orders">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Заказ ${order.number}`}
          description={`Создан: ${created} · id: ${order.id}`}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.payment_status} />
            </div>
          }
        />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList>
          <TabsTrigger value="info">Информация</TabsTrigger>
          <TabsTrigger value="items">Товары</TabsTrigger>
          <TabsTrigger value="payments">Платежи</TabsTrigger>
          <TabsTrigger value="timeline">Журнал</TabsTrigger>
          <TabsTrigger value="delivery">Доставка</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Клиент</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Имя:</span> {order.user_name ?? "—"}</p>
                <p><span className="text-muted-foreground">Email:</span> {order.user_email ?? "—"}</p>
                <p><span className="text-muted-foreground">user_id:</span> {order.user_id}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Маркетплейс</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Роль:</span> {order.seller_label}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Финансы</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Подытог:</span> {fmt(order.subtotal_amount)} ₽</p>
                <p><span className="text-muted-foreground">Доставка:</span> {fmt(order.delivery_amount)} ₽</p>
                <p><span className="text-muted-foreground">Итого:</span>{" "}<span className="font-semibold">{fmt(order.total_amount)} ₽</span></p>
                <p><span className="text-muted-foreground">Оплата:</span> <StatusBadge status={order.payment_status} /></p>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-5 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Доставка (кратко)</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Провайдер:</span> {order.delivery_provider ?? "—"}</p>
                <p><span className="text-muted-foreground">Снимок:</span> {order.delivery_label}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="text-left p-3">Товар</th>
                  <th className="text-right p-3">Цена</th>
                  <th className="text-right p-3">Кол-во</th>
                  <th className="text-right p-3">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item) => (
                  <tr key={item.id} className="border-t border-border text-sm">
                    <td className="p-3 font-medium">{item.product_name}</td>
                    <td className="p-3 text-right">{fmt(item.unit_price)} ₽</td>
                    <td className="p-3 text-right">{item.quantity}</td>
                    <td className="p-3 text-right font-medium">{fmt(item.total_price)} ₽</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border text-sm font-semibold">
                  <td className="p-3" colSpan={3}>Итого</td>
                  <td className="p-3 text-right">{fmt(order.total_amount)} ₽</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {(order.payments ?? []).length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">Платежи не связаны или ещё не созданы.</p>
            ) : (
              order.payments.map((p) => (
                <div key={p.id} className="p-5 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-mono text-xs">#{p.id}</span>
                  <StatusBadge status={p.status} />
                  <span className="uppercase text-xs">{p.provider}</span>
                  <span className="font-medium">{fmt(Number(p.amount))} ₽</span>
                  <span className="text-xs text-muted-foreground">
                    provider_id: {p.provider_id ?? "—"}
                  </span>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="space-y-4">
              {timeline.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full shrink-0 ${t.date ? "bg-primary" : "bg-border"}`} />
                  <span className={`text-sm flex-1 ${t.date ? "" : "text-muted-foreground"}`}>{t.label}</span>
                  {t.date ? <span className="text-xs text-muted-foreground">{t.date}</span> : null}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3 text-sm">
            <pre className="text-xs whitespace-pre-wrap break-all bg-muted/30 rounded-md p-3 overflow-auto max-h-[360px]">
              {JSON.stringify(snap, null, 2)}
            </pre>
            <p className="text-xs text-muted-foreground leading-relaxed">
              JSON из поля delivery_snapshot в БД без преобразований.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-0 bg-card border-t border-border -mx-4 md:-mx-6 px-4 md:px-6 py-3 flex items-center gap-2 justify-end">
        <Button variant="outline" size="sm" className="gap-1.5" type="button" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> Печать
        </Button>
        <PermissionGate permission="orders.cancel">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" disabled>
            Отменить (нет API)
          </Button>
        </PermissionGate>
        <PermissionGate permission="orders.refund">
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" disabled>
            Возврат (нет API)
          </Button>
        </PermissionGate>
      </div>
    </div>
  );
}
