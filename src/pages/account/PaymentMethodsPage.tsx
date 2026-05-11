import { useEffect, useMemo, useState } from "react";
import { CreditCard, Plus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storeAccountApi, type AccountPaymentMethod, type StoreAccountPaymentProvider } from "@/lib/api";
import { toast } from "sonner";
import { filterVisibleStorefrontProviders, paymentProviderDisplayName } from "@/lib/storefrontPaymentProviders";

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<AccountPaymentMethod[]>([]);
  const [providers, setProviders] = useState<StoreAccountPaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);

  const visibleProviders = useMemo(() => filterVisibleStorefrontProviders(providers), [providers]);

  const load = () => {
    setLoading(true);
    storeAccountApi.paymentMethods()
      .then((r) => {
        setMethods(r.data);
        setProviders(r.providers ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить способы оплаты"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (id: number) => {
    await storeAccountApi.deletePaymentMethod(id);
    toast.success("Способ оплаты удалён");
    load();
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Способы оплаты</h2>

      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        Список способов ниже совпадает с <strong className="text-foreground">активными платёжными интеграциями магазина</strong> (как в CRM). Сохранённые карты
        появятся после добавления, если провайдер поддерживает токенизацию карт.
      </p>

      <div className="space-y-3 mb-6">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Загрузка…</p>
        ) : methods.length === 0 ? (
          <div className="p-4 rounded-2xl border border-border text-sm text-muted-foreground">
            Сохранённых способов оплаты нет. Карты и токены хранятся у платёжного провайдера в защищённом виде.
          </div>
        ) : methods.map(card => (
          <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl border border-border">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">{card.brand || card.provider} •••• {card.last4 || "----"}</p>
                <p className="text-xs text-muted-foreground">Действует до {card.exp_month || "—"}/{card.exp_year || "—"}</p>
              </div>
            </div>
            <button onClick={() => void remove(card.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <Button variant="outline" className="rounded-lg gap-2" disabled={visibleProviders.length === 0} title={visibleProviders.length === 0 ? "Нет активных платёжных интеграций" : undefined}>
        <Plus className="w-4 h-4" />Добавить карту
      </Button>
      {visibleProviders.length === 0 && !loading ? (
        <p className="text-xs text-muted-foreground mt-2 max-w-xl">
          Нет активных способов оплаты для витрины. Включите и настройте платёжную интеграцию в CRM (Интеграции → Платежи).
        </p>
      ) : null}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Подключённые способы оплаты</h3>
        <p className="text-xs text-muted-foreground mb-3">Только провайдеры с флагом «активен» на стороне сервера и допустимые для этой витрины.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {loading ? null : visibleProviders.length === 0 ? (
            <div className="col-span-full p-4 rounded-xl border border-border text-center text-xs text-muted-foreground">
              Сейчас для оплаты доступны только те методы, которые настроены у магазина. Обратитесь в поддержку, если ожидаете другой способ.
            </div>
          ) : (
            visibleProviders.map((m) => (
              <div key={m.name} className="p-4 rounded-xl border border-border text-center">
                <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{paymentProviderDisplayName(m)}</p>
                <p className="text-xs text-muted-foreground mt-1">Подключён</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsPage;
