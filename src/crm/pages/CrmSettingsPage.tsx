import { PageHeader } from "../components/PageHeader";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { marketplaceSettingsApi, type MarketplaceCategoryNode, type MarketplaceContact, type MarketplaceSettingsData } from "@/lib/api";
import { toast } from "sonner";

const QK_MARKETPLACE_SETTINGS = ["crm-marketplace-settings"] as const;

function emptySettings(): MarketplaceSettingsData {
  return {
    marketplace_name: "Cheepy",
    support_emails: [{ email: "support@cheepy.ru", description: "Основная поддержка" }],
    support_phones: [{ phone: "+7 (800) 123-45-67", description: "Основной телефон" }],
    default_currency: "RUB",
    maintenance_enabled: false,
    maintenance_delay_minutes: 10,
    maintenance_started_at: null,
    seller_registration_enabled: true,
    default_commission_percent: 10,
    category_commissions: {},
    currency_rates: { date: null, base: "RUB", rates: [{ code: "RUB", name: "Российский рубль", nominal: 1, value: 1 }] },
  };
}

function contactValue(row: MarketplaceContact, kind: "email" | "phone"): string {
  return String(row[kind] ?? "");
}

function CategoryCommissionRows({
  nodes,
  values,
  onChange,
  depth = 0,
}: {
  nodes: MarketplaceCategoryNode[];
  values: Record<string, number>;
  onChange: (categoryId: number, value: number | null) => void;
  depth?: number;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.id} className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1" style={{ paddingLeft: depth * 18 }}>
              <p className="truncate text-sm font-medium">{node.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{node.slug}</p>
            </div>
            <Input
              type="number"
              min={0}
              step="0.1"
              value={values[String(node.id)] ?? ""}
              placeholder="по умолч."
              onChange={(e) => onChange(node.id, e.target.value === "" ? null : Number(e.target.value))}
              className="h-8 w-28 text-right text-sm"
            />
          </div>
          {node.children?.length ? <CategoryCommissionRows nodes={node.children} values={values} onChange={onChange} depth={depth + 1} /> : null}
        </div>
      ))}
    </>
  );
}

export default function CrmSettingsPage() {
  const qc = useQueryClient();
  const [ratesOpen, setRatesOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: QK_MARKETPLACE_SETTINGS,
    queryFn: () => marketplaceSettingsApi.get(),
  });
  const [draft, setDraft] = useState<MarketplaceSettingsData>(() => emptySettings());
  useEffect(() => {
    if (data?.data) setDraft(data.data);
  }, [data?.data]);
  const settings = draft;
  const categories = data?.categories ?? [];
  const currencies = useMemo(() => settings.currency_rates.rates ?? [], [settings.currency_rates.rates]);

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<MarketplaceSettingsData>) => marketplaceSettingsApi.update(payload),
    onSuccess: (res) => {
      setDraft(res.data);
      toast.success("Настройки сохранены");
      qc.invalidateQueries({ queryKey: QK_MARKETPLACE_SETTINGS });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось сохранить настройки"),
  });
  const refreshCurrencies = useMutation({
    mutationFn: () => marketplaceSettingsApi.refreshCurrencies(),
    onSuccess: () => {
      toast.success("Курсы валют обновлены");
      qc.invalidateQueries({ queryKey: QK_MARKETPLACE_SETTINGS });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось обновить курсы"),
  });

  const update = (patch: Partial<MarketplaceSettingsData>) => setDraft((prev) => ({ ...prev, ...patch }));
  const saveSettings = () => saveMutation.mutate(settings);
  const updateContact = (kind: "support_emails" | "support_phones", index: number, field: "email" | "phone" | "description", value: string) => {
    const rows = [...(settings[kind] ?? [])];
    rows[index] = { ...rows[index], [field]: value };
    update({ [kind]: rows } as Partial<MarketplaceSettingsData>);
  };
  const addContact = (kind: "support_emails" | "support_phones") =>
    update({ [kind]: [...(settings[kind] ?? []), kind === "support_emails" ? { email: "", description: "" } : { phone: "", description: "" }] } as Partial<MarketplaceSettingsData>);
  const removeContact = (kind: "support_emails" | "support_phones", index: number) =>
    update({ [kind]: (settings[kind] ?? []).filter((_, i) => i !== index) } as Partial<MarketplaceSettingsData>);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Настройки" description="Конфигурация маркетплейса" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="text-xs">Общие</TabsTrigger>
          <TabsTrigger value="commission" className="text-xs">Комиссии</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Платежи</TabsTrigger>
          <TabsTrigger value="email" className="text-xs">Email</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs">SEO</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Логи</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
            {isLoading ? <p className="text-sm text-muted-foreground">Загрузка настроек...</p> : null}
            <div>
              <Label className="text-xs">Название маркетплейса</Label>
              <Input value={settings.marketplace_name} onChange={(e) => update({ marketplace_name: e.target.value })} className="h-8 text-sm mt-1" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Email поддержки</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => addContact("support_emails")}>Добавить email</Button>
              </div>
              {(settings.support_emails ?? []).map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={contactValue(row, "email")} onChange={(e) => updateContact("support_emails", i, "email", e.target.value)} placeholder="email" className="h-8 text-sm" />
                  <Input value={row.description ?? ""} onChange={(e) => updateContact("support_emails", i, "description", e.target.value)} placeholder="описание" className="h-8 text-sm" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeContact("support_emails", i)}>Удалить</Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Телефоны</Label>
                <Button type="button" size="sm" variant="outline" onClick={() => addContact("support_phones")}>Добавить телефон</Button>
              </div>
              {(settings.support_phones ?? []).map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                  <Input value={contactValue(row, "phone")} onChange={(e) => updateContact("support_phones", i, "phone", e.target.value)} placeholder="телефон" className="h-8 text-sm" />
                  <Input value={row.description ?? ""} onChange={(e) => updateContact("support_phones", i, "description", e.target.value)} placeholder="описание" className="h-8 text-sm" />
                  <Button type="button" size="sm" variant="ghost" onClick={() => removeContact("support_phones", i)}>Удалить</Button>
                </div>
              ))}
            </div>

            <div><Label className="text-xs">Валюта по умолчанию</Label>
              <div className="flex gap-2 mt-1">
              <Select value={settings.default_currency} onValueChange={(v) => update({ default_currency: v })}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {currencies.map((r) => <SelectItem key={r.code} value={r.code}>{r.code} · {r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button type="button" size="sm" variant="outline" onClick={() => setRatesOpen(true)}>Курсы</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => refreshCurrencies.mutate()}>Обновить ЦБ</Button>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div className="flex items-center justify-between"><span className="text-sm">Режим обслуживания</span><Switch checked={settings.maintenance_enabled} onCheckedChange={(v) => update({ maintenance_enabled: v })} /></div>
              <Input
                type="number"
                min={1}
                value={settings.maintenance_delay_minutes}
                onChange={(e) => update({ maintenance_delay_minutes: Math.max(1, Number(e.target.value) || 1) })}
                className="h-8 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground">При включении запускается таймер. После указанного времени витрина перейдёт на страницу обслуживания.</p>
            <div className="flex items-center justify-between"><span className="text-sm">Регистрация продавцов</span><Switch checked={settings.seller_registration_enabled} onCheckedChange={(v) => update({ seller_registration_enabled: v })} /></div>
            <Button size="sm" onClick={saveSettings} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="commission" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-3xl">
            <div>
              <Label className="text-xs">Комиссия по умолчанию (%)</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                value={settings.default_commission_percent}
                onChange={(e) => update({ default_commission_percent: Math.max(0, Number(e.target.value) || 0) })}
                className="h-8 text-sm mt-1"
              />
            </div>
            <h3 className="text-sm font-medium pt-2">По категориям</h3>
            <p className="text-xs text-muted-foreground">Если поле категории пустое, используется комиссия родителя или комиссия по умолчанию.</p>
            <CategoryCommissionRows
              nodes={categories}
              values={settings.category_commissions ?? {}}
              onChange={(categoryId, value) => {
                const next = { ...(settings.category_commissions ?? {}) };
                if (value === null) {
                  delete next[String(categoryId)];
                } else {
                  next[String(categoryId)] = value;
                }
                update({ category_commissions: next });
              }}
            />
            <Button size="sm" onClick={saveSettings} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить комиссии"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between"><span className="text-sm">Банковские карты</span><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><span className="text-sm">СБП</span><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><span className="text-sm">Баланс пользователя</span><Switch defaultChecked /></div>
            <div className="flex items-center justify-between"><span className="text-sm">Наложенный платёж</span><Switch /></div>
            <Button size="sm">Сохранить</Button>
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
            <div><Label className="text-xs">Шаблон подтверждения заказа</Label><Textarea rows={4} defaultValue="Здравствуйте, {{name}}! Ваш заказ {{order_id}} подтверждён." className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Шаблон отправки</Label><Textarea rows={4} defaultValue="Ваш заказ {{order_id}} отправлен. Трек-номер: {{tracking}}." className="mt-1 text-sm" /></div>
            <Button size="sm">Сохранить</Button>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
            <div><Label className="text-xs">Title главной</Label><Input defaultValue="Cheepy — маркетплейс модной одежды" className="h-8 text-sm mt-1" /></div>
            <div><Label className="text-xs">Meta Description</Label><Textarea rows={2} defaultValue="Покупайте модную одежду, обувь и аксессуары на Cheepy. Доставка по всей России." className="mt-1 text-sm" /></div>
            <div><Label className="text-xs">Robots.txt</Label><Textarea rows={3} defaultValue="User-agent: *\nAllow: /" className="mt-1 text-sm font-mono" /></div>
            <Button size="sm">Сохранить</Button>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <div className="rounded-lg border border-border bg-card p-6 space-y-4 max-w-2xl">
            <div className="flex items-center justify-between"><span className="text-sm">Логирование действий</span><Switch defaultChecked /></div>
            <div><Label className="text-xs">Уровень логирования</Label>
              <Select defaultValue="info"><SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Хранить логи (дней)</Label><Input type="number" defaultValue="30" className="h-8 text-sm mt-1" /></div>
            <Button size="sm">Сохранить</Button>
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={ratesOpen} onOpenChange={setRatesOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Курсы валют ЦБ РФ {settings.currency_rates.date ? `за ${settings.currency_rates.date}` : ""}</DialogTitle></DialogHeader>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground"><tr><th className="p-2 text-left">Код</th><th className="p-2 text-left">Валюта</th><th className="p-2 text-right">Номинал</th><th className="p-2 text-right">Курс к RUB</th></tr></thead>
              <tbody>
                {currencies.map((r) => (
                  <tr key={r.code} className="border-t">
                    <td className="p-2 font-mono">{r.code}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-right">{r.nominal}</td>
                    <td className="p-2 text-right">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
