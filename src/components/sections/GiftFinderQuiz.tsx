import { useState } from "react";
import { ArrowRight, ArrowLeft, Gift, User, Users } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useQuizScrollIntoView } from "@/hooks/useQuizScrollIntoView";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const steps = [
  {
    question: "Для кого подарок?",
    options: [
      { label: "Мужчине", icon: User },
      { label: "Женщине", icon: User },
      { label: "Ребёнку", icon: Users },
      { label: "Другу/коллеге", icon: Users },
    ],
  },
  {
    question: "Какой повод?",
    options: [
      { label: "День рождения" },
      { label: "Новый год" },
      { label: "Без повода" },
      { label: "Профессиональный" },
    ],
  },
  {
    question: "Бюджет на подарок?",
    options: [
      { label: "До 2 000 ₽" },
      { label: "2 000 – 5 000 ₽" },
      { label: "5 000 – 10 000 ₽" },
      { label: "10 000+ ₽" },
    ],
  },
];

const gifts = [
  { name: "Набор аксессуаров", price: "3 490 ₽", image: product1 },
  { name: "Кожаный кошелёк", price: "2 990 ₽", image: product2 },
  { name: "Парфюм премиум", price: "4 990 ₽", image: product3 },
];

const GiftFinderQuiz = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const done = step >= steps.length;
  const progress = done ? 100 : (step / steps.length) * 100;

  const pick = (label: string) => { setAnswers([...answers, label]); setStep(step + 1); };
  const back = () => { if (step > 0) { setStep(step - 1); setAnswers(answers.slice(0, -1)); } };
  const reset = () => { setStep(0); setAnswers([]); };

  useQuizScrollIntoView(ref, step, done);

  return (
    <section ref={ref} className={`py-8 scroll-mt-24 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card p-5 md:p-7 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={16} className="text-primary" />
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Подбор подарка</span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-4">Найдите идеальный подарок</h2>

        <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {!done ? (
          <div key={step} className="animate-fade-in min-h-[200px] transition-all duration-300">
            <p className="text-xs text-muted-foreground mb-3">Шаг {step + 1} из {steps.length}</p>
            <p className="text-sm font-semibold text-foreground mb-4">{steps[step].question}</p>
            <div className="grid grid-cols-2 gap-2">
              {steps[step].options.map((opt) => {
                const Icon = (opt as any).icon;
                return (
                  <button key={opt.label} onClick={() => pick(opt.label)} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer group">
                    {Icon && <Icon size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />}
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
            {step > 0 && (
              <button onClick={back} className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={12} /> Назад
              </button>
            )}
          </div>
        ) : (
          <div className="animate-fade-in text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Gift size={24} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Идеальные подарки найдены!</p>
            <p className="text-xs text-muted-foreground mb-4">{answers.join(" · ")}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {gifts.map((g, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden bg-background">
                  <div className="aspect-square overflow-hidden">
                    <img src={g.image} alt={g.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-foreground truncate">{g.name}</p>
                    <p className="text-[11px] font-bold text-primary">{g.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <button className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                Смотреть подарки <ArrowRight size={14} />
              </button>
              <button onClick={reset} className="h-9 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Заново
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GiftFinderQuiz;
