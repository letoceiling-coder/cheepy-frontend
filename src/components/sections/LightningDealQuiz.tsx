import { useState, useEffect } from "react";
import { ArrowRight, ArrowLeft, Zap, Timer } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";
import product4 from "@/assets/product-4.jpg";
import product5 from "@/assets/product-5.jpg";
import product6 from "@/assets/product-6.jpg";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";

const steps = [
  {
    question: "Какие товары вас интересуют?",
    options: [
      { label: "Одежда", image: hero1 },
      { label: "Электроника", image: product2 },
      { label: "Аксессуары", image: product4 },
      { label: "Для дома", image: hero2 },
    ],
  },
  {
    question: "Что для вас важнее всего?",
    options: [
      { label: "Лучшая цена" },
      { label: "Премиум качество" },
      { label: "Популярные бренды" },
      { label: "В тренде" },
    ],
  },
  {
    question: "Ваш бюджет?",
    options: [
      { label: "До 2 000 ₽" },
      { label: "2 000 – 5 000 ₽" },
      { label: "5 000 – 10 000 ₽" },
      { label: "10 000+ ₽" },
    ],
  },
];

const deals = [
  { name: "Куртка-парка", price: "3 990 ₽", old: "5 990 ₽", discount: "-33%", image: product1 },
  { name: "Наушники Pro", price: "2 490 ₽", old: "3 990 ₽", discount: "-38%", image: product3 },
  { name: "Кроссовки Air", price: "5 490 ₽", old: "7 990 ₽", discount: "-31%", image: product5 },
  { name: "Рюкзак Urban", price: "1 990 ₽", old: "2 990 ₽", discount: "-33%", image: product6 },
];

const LightningDealQuiz = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timer, setTimer] = useState(30);
  const done = step >= steps.length;
  const progress = done ? 100 : (step / steps.length) * 100;

  useEffect(() => {
    if (done || timer <= 0) return;
    const id = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [done, timer]);

  const pick = (label: string) => {
    setAnswers([...answers, label]);
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep(step - 1);
    setAnswers(answers.slice(0, -1));
  };

  const reset = () => { setStep(0); setAnswers([]); setTimer(30); };

  const urgent = timer <= 10;

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card p-5 md:p-7 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Zap size={16} className="text-primary" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Молниеносная скидка</span>
            </div>
            <h2 className="text-lg font-bold text-foreground">Найдите свою скидку за 30 секунд</h2>
          </div>
          {!done && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${urgent ? "border-destructive/40 bg-destructive/10" : "border-border bg-secondary/50"} transition-colors`}>
              <Timer size={14} className={urgent ? "text-destructive animate-pulse" : "text-muted-foreground"} />
              <span className={`text-sm font-bold tabular-nums ${urgent ? "text-destructive" : "text-foreground"}`}>
                0:{timer.toString().padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {!done ? (
          <div key={step} className="animate-fade-in">
            <p className="text-xs text-muted-foreground mb-3">Шаг {step + 1} из {steps.length}</p>
            <p className="text-sm font-semibold text-foreground mb-4">{steps[step].question}</p>

            <div className={`grid gap-2 ${"image" in steps[step].options[0] ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
              {steps[step].options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => pick(opt.label)}
                  className="rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer group overflow-hidden"
                >
                  {"image" in opt && opt.image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={opt.image} alt={opt.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                  )}
                  <div className={opt.image ? "p-2.5" : "p-3 text-center"}>
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {step > 0 && (
              <button onClick={back} className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={12} /> Назад
              </button>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <p className="text-sm font-semibold text-foreground mb-4">🔥 Ваши персональные скидки готовы!</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {deals.map((d, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden bg-background group">
                  <div className="aspect-square overflow-hidden relative">
                    <img src={d.image} alt={d.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <span className="absolute top-1.5 left-1.5 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">{d.discount}</span>
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-foreground truncate">{d.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-[11px] font-bold text-primary">{d.price}</span>
                      <span className="text-[10px] text-muted-foreground line-through">{d.old}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                Забрать скидку <ArrowRight size={14} />
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

export default LightningDealQuiz;
