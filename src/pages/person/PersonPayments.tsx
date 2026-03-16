import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useState, useEffect } from "react";

const savedCards = [
  { id: "1", brand: "VISA", last4: "1234" },
  { id: "2", brand: "VISA", last4: "1234" },
];

const PersonPayments = () => {
  const [wallet] = useState("Qiwi кошелек");
  const { toast } = useToast();
  const { requireAuth } = useLoginPrompt();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleAddCard = () => {
    if (!requireAuth("Привязать банковскую карту")) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Карта добавлена", description: "Банковская карта успешно привязана" });
    }, 1000);
  };

  const handleDeleteCard = (id: string) => {
    if (!requireAuth("Удалить карту")) return;
    toast({ title: "Карта удалена", description: "Способ оплаты успешно удалён" });
  };

  const handleAddPayment = () => {
    if (!requireAuth("Добавить способ оплаты")) return;
    toast({ title: "Добавлено" });
  };

  if (loading) return <PaymentsSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground">Способы оплаты</h2>

      {/* Saved cards */}
      <section>
        <h3 className="font-semibold text-foreground mb-4">Сохраненные карты</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedCards.map(card => (
            <div key={card.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card transition-all duration-250 hover:-translate-y-[3px] hover:shadow-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold tracking-wider text-foreground">{card.brand}</span>
                <span className="text-sm text-foreground">**{card.last4}</span>
              </div>
              <button onClick={() => handleDeleteCard(card.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Other */}
      <section>
        <h3 className="font-semibold text-foreground mb-3">Другие</h3>
        <div className="flex items-center gap-3 text-sm text-foreground p-3 rounded-xl hover:bg-secondary transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">Q</div>
          <span>+7 900 123 45 67</span>
        </div>
      </section>

      {/* Add payment */}
      <section>
        <h3 className="text-xl font-bold text-foreground mb-4">Добавить способ оплаты</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-foreground mb-3">Банковская карта</h4>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold tracking-wider text-primary">VISA</span>
              <span className="text-lg font-bold text-destructive">●●</span>
            </div>
            <div className="space-y-3">
              <Input placeholder="0000 0000 0000 0000" className="rounded-xl" />
              <div className="grid grid-cols-3 gap-3">
                <Input placeholder="ММ" className="rounded-xl" />
                <Input placeholder="ГГ" className="rounded-xl" />
                <Input placeholder="CVC" className="rounded-xl" />
              </div>
            </div>
            <Button
              onClick={handleAddCard}
              disabled={submitting}
              className="gradient-primary text-primary-foreground rounded-xl px-6 mt-4 w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Привязка...
                </span>
              ) : "Привязать банковскую карту"}
            </Button>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-3">Другой способ оплаты</h4>
            <div className="rounded-2xl border border-border p-4 mb-4 hover:border-primary/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">Q</div>
                  <span className="text-sm font-medium text-foreground">{wallet}</span>
                </div>
                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
            <Button onClick={handleAddPayment} className="gradient-primary text-primary-foreground rounded-xl px-6 w-full shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
              Добавить способ оплаты
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              Нажимая кнопку добавить способ оплаты, Вы будете направлены на сайт электронного кошелька для входа и подтверждения добавления способа оплаты
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const PaymentsSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[0,1].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
    </div>
    <Skeleton className="h-64 rounded-2xl" />
  </div>
);

export default PersonPayments;
