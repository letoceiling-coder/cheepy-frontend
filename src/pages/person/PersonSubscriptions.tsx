import { useState, useEffect } from "react";
import { Crown, Zap, Gift, Check, ChevronRight } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const plans = [
  {
    id: "free",
    name: "Бесплатный",
    price: 0,
    icon: Gift,
    color: "text-muted-foreground bg-secondary",
    features: ["Базовые функции", "Стандартная доставка", "E-mail уведомления"],
    current: true,
  },
  {
    id: "plus",
    name: "Plus",
    price: 299,
    icon: Zap,
    color: "text-primary bg-primary/10",
    features: ["Бесплатная доставка", "Приоритетная поддержка", "Ранний доступ к распродажам", "Повышенный кешбек 5%"],
    current: false,
  },
  {
    id: "premium",
    name: "Premium",
    price: 599,
    icon: Crown,
    color: "text-amber-500 bg-amber-500/10",
    features: ["Всё из Plus", "Персональный менеджер", "Эксклюзивные предложения", "Кешбек 10%", "Бесплатные возвраты"],
    current: false,
  },
];

const PersonSubscriptions = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleSubscribe = (name: string) => {
    if (!requireAuth(`Подписаться на ${name}`)) return;
    toast({ title: "Подписка оформлена", description: `Вы подписались на план ${name}` });
  };

  if (loading) return <SubsSkeleton />;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-foreground mb-2">Подписки</h2>
      <p className="text-sm text-muted-foreground mb-6">Выберите план для получения дополнительных преимуществ</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <div
            key={plan.id}
            className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg animate-fade-in flex flex-col ${
              plan.current ? "border-primary/30 bg-primary/[0.02]" : "border-border bg-card hover:border-primary/20"
            }`}
            style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl ${plan.color} flex items-center justify-center`}>
                <plan.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-foreground">{plan.name}</p>
                <p className="text-sm text-muted-foreground">
                  {plan.price === 0 ? "Бесплатно" : `${plan.price} ₽/мес`}
                </p>
              </div>
            </div>

            <div className="space-y-2 flex-1 mb-4">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs text-foreground">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  {f}
                </div>
              ))}
            </div>

            {plan.current ? (
              <div className="text-center py-2 rounded-xl bg-primary/5 text-xs font-medium text-primary">
                Текущий план
              </div>
            ) : (
              <Button
                onClick={() => handleSubscribe(plan.name)}
                className="w-full gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                Подключить <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SubsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-7 w-32" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[0,1,2].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonSubscriptions;
