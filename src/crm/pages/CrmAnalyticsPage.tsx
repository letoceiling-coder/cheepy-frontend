import { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { crmStoreInsightsApi } from "@/lib/api";

const fmt = (n: number) => new Intl.NumberFormat('ru-RU').format(n);
const COLORS = [
  "hsl(262,83%,58%)", "hsl(280,90%,60%)", "hsl(340,80%,55%)", "hsl(20,90%,55%)",
  "hsl(200,80%,50%)", "hsl(150,60%,45%)", "hsl(45,90%,55%)", "hsl(0,70%,55%)",
];

export default function CrmAnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["crm-store-analytics", period],
    queryFn: () => crmStoreInsightsApi.analytics(period),
  });

  const payload = data?.data;
  const salesChartData = (payload?.sales_chart ?? []).map((r) => ({
    label: r.label,
    revenue: r.revenue_rub,
    orders: r.orders,
  }));
  const categoryAnalytics = payload?.category_revenue ?? [];
  const geoRows = payload?.geo_delivery ?? [];
  const funnel = payload?.order_status_funnel ?? [];
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Аналитика"
        description="Выручка и статусы заказов по данным storefront (CustomerOrder)."
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-32 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 дней</SelectItem>
                <SelectItem value="30d">30 дней</SelectItem>
                <SelectItem value="6m">6 месяцев</SelectItem>
                <SelectItem value="1y">1 год</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              <Download className="h-3.5 w-3.5" /> Экспорт
            </Button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить аналитику.
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex justify-center py-24 gap-2 text-muted-foreground text-sm items-center">
          <Loader2 className="h-8 w-8 animate-spin" /> Загрузка…
        </div>
      ) : (
        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales" className="text-xs">Продажи</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs">Категории</TabsTrigger>
            <TabsTrigger value="geo" className="text-xs">Доставка</TabsTrigger>
            <TabsTrigger value="conversion" className="text-xs">Статусы</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-4">Выручка (оплачено)</h3>
                {salesChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Нет данных</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-4">Заказы (оплачено)</h3>
                {salesChartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Нет данных</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-4">Выручка по категории каталога</h3>
                {categoryAnalytics.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Нет связанных строк заказ ↔ system_products</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryAnalytics} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => fmt(v)} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={120} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue_rub" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium mb-4">Доля позиций (шт.)</h3>
                {categoryAnalytics.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Нет данных</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryAnalytics}
                        dataKey="orders"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name }) => name}
                      >
                        {categoryAnalytics.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="geo" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-1">Способ доставки (из снимка заказа)</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Полноценной геолокации клиентов в заказах сейчас нет — отображены режимы вместо городов.
              </p>
              {geoRows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-12 text-center">Нет оплаченных заказов</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={geoRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval={0} angle={-20} height={72} />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip formatter={(v: number, name: string) => (name === "revenue_rub" ? fmt(v) : v)} />
                    <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="conversion" className="mt-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-sm font-medium mb-1">Распределение статусов заказов</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Веб-воронка (посетители→корзина) здесь недоступна без отдельного трекинга; показано то, что реально лежит в БД по заказам.
              </p>
              <div className="space-y-3">
                {funnel.map((step) => {
                  const pct = Math.round((step.count / maxFunnel) * 1000) / 10;

                  return (
                    <div key={step.stage} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{step.stage}</span>
                        <span className="text-muted-foreground">{fmt(step.count)} ({pct}% от максимума)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              {payload?.payment_summary ? (
                <div className="mt-8 border-t pt-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">Платежи (все операции)</h4>
                  <pre className="text-xs bg-muted/50 rounded-md p-3 overflow-x-auto">{JSON.stringify(payload.payment_summary, null, 2)}</pre>
                </div>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
