import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crmCouponsApi, type CrmCouponItem, type CrmCouponAnalytics } from "@/lib/api";
import { Plus, Ticket, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

const emptyForm = {
  code: "",
  name: "",
  discount_type: "percent" as "percent" | "fixed",
  discount_value: 0,
  min_order_amount: 0,
  max_uses: 100,
  max_uses_per_user: 1,
  target: "all",
  expires_at: "",
};

export default function CrmCouponsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [items, setItems] = useState<CrmCouponItem[]>([]);
  const [analytics, setAnalytics] = useState<CrmCouponAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    setLoading(true);
    crmCouponsApi.list()
      .then((r) => {
        setItems(r.data);
        setAnalytics(r.analytics);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить промокоды"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createCoupon = async () => {
    try {
      await crmCouponsApi.create({
        ...form,
        code: form.code.trim().toUpperCase(),
        name: form.name.trim() || form.code.trim().toUpperCase(),
        starts_at: null,
        expires_at: form.expires_at || null,
        is_active: true,
      });
      toast.success("Промокод создан");
      setCreateOpen(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать промокод");
    }
  };

  const columns: Column<CrmCouponItem>[] = [
    { key: "code", title: "Код", render: c => (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-sm font-medium">{c.code}</span>
        <button className="text-muted-foreground hover:text-foreground"><Copy className="h-3 w-3" /></button>
      </div>
    )},
    { key: "discount_value", title: "Скидка", render: c => c.discount_type === 'percent' ? `${c.discount_value}%` : `${fmt(c.discount_value)} RUB` },
    { key: "min_order_amount", title: "Мин. заказ", render: c => c.min_order_amount > 0 ? `${fmt(c.min_order_amount)} RUB` : '—', className: "hidden md:table-cell" },
    { key: "target", title: "Для кого", render: c => <span className="text-xs capitalize">{c.target === 'all' ? 'Все' : c.target === 'new' ? 'Новые' : 'VIP'}</span> },
    { key: "used_count", title: "Использовано", render: c => `${c.used_count} / ${c.max_uses ?? "∞"}` },
    { key: "expires_at", title: "Истекает", render: c => c.expires_at ? new Date(c.expires_at).toLocaleDateString("ru-RU") : "—" },
    { key: "is_active", title: "Статус", render: c => <StatusBadge status={c.is_active ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Промокоды"
        description={analytics ? `${analytics.total} промокодов · использовано ${analytics.used_count} · скидок ${fmt(analytics.discount_amount)} RUB` : "Управление промокодами"}
        actions={<Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" /> Создать промокод</Button>}
      />
      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка промокодов…
        </div>
      ) : (
        <DataTable data={items} columns={columns} />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Ticket className="h-4 w-4" /> Новый промокод</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-xs">Код</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="h-8 text-sm mt-1 font-mono" placeholder="EXAMPLE20" /></div>
            <div><Label className="text-xs">Название</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 text-sm mt-1" placeholder="Скидка для покупателей" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Скидка</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: Number(e.target.value) || 0 })} className="h-8 text-sm mt-1" /></div>
              <div><Label className="text-xs">Тип</Label>
                <Select value={form.discount_type} onValueChange={(v: "percent" | "fixed") => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Процент (%)</SelectItem>
                    <SelectItem value="fixed">Фиксированная (RUB)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Мин. заказ (RUB)</Label><Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: Number(e.target.value) || 0 })} className="h-8 text-sm mt-1" /></div>
              <div><Label className="text-xs">Макс. использований</Label><Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) || 1 })} className="h-8 text-sm mt-1" /></div>
            </div>
            <div><Label className="text-xs">Для кого</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все пользователи</SelectItem>
                  <SelectItem value="new">Новые</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Дата окончания</Label><Input value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} type="date" className="h-8 text-sm mt-1" /></div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button size="sm" onClick={() => void createCoupon()}>Создать</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
