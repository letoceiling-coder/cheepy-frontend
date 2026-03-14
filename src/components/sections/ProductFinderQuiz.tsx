import { useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles, ShoppingBag, Laptop, Watch, Home, Gift, User, Users, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const steps = [
  {
    question: "Что вы ищете?",
    options: [
      { label: "Одежда", icon: ShoppingBag },
      { label: "Электроника", icon: Laptop },
      { label: "Аксессуары", icon: Watch },
      { label: "Для дома", icon: Home },
      { label: "Подарки", icon: Gift },
    ],
  },
  {
    question: "Для кого покупка?",
    options: [
      { label: "Для себя", icon: User },
      { label: "Мужчине", icon: Users },
      { label: "Женщине", icon: Users },
      { label: "Ребёнку", icon: Users },
      { label: "В подарок", icon: Gift },
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

const results = [
  { name: "Куртка оверсайз", price: "4 990 ₽", image: product1 },
  { name: "Кроссовки спорт", price: "6 490 ₽", image: product2 },
  { name: "Сумка кожаная", price: "3 290 ₽", image: product3 },
];

const ProductFinderQuiz = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const done = step >= steps.length;
  const progress = done ? 100 : (step / steps.length) * 100;

  const pick = (label: string) => {
    setAnswers([...answers, label]);
    setStep(step + 1);
  };

  const reset = () => { setStep(0); setAnswers([]); setStarted(false); };

  return (
    <section ref={ref} className={`py-5 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px]">
          {/* Left — Quiz */}
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Подбор товара</span>
            </div>
            <h2 className="text-base font-bold text-foreground mb-3">Найдите идеальный товар за 30 секунд</h2>

            {/* Progress */}
            <div className="h-1 rounded-full bg-secondary mb-4 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
            </div>

            {!started && !done ? (
              <div className="animate-fade-in">
                <p className="text-xs text-muted-foreground mb-3">Ответьте на 3 простых вопроса и получите персональную подборку товаров</p>
                <button
                  onClick={() => setStarted(true)}
                  className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Начать подбор <ArrowRight size={14} />
                </button>
              </div>
            ) : !done ? (
              <div key={step} className="animate-fade-in">
                <p className="text-[11px] text-muted-foreground mb-2">Шаг {step + 1} из {steps.length}</p>
                <p className="text-sm font-semibold text-foreground mb-3">{steps[step].question}</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {steps[step].options.map((opt) => {
                    const Icon = (opt as any).icon;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => pick(opt.label)}
                        className="flex items-center gap-2 h-[72px] px-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 cursor-pointer group"
                      >
                        {Icon && <Icon size={16} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />}
                        <span className="text-xs font-medium text-foreground">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {step > 0 && (
                  <button onClick={() => { setStep(step - 1); setAnswers(answers.slice(0, -1)); }} className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft size={11} /> Назад
                  </button>
                )}
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-sm font-semibold text-foreground mb-3">Лучшие предложения для вас!</p>
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {results.map((r, i) => (
                    <div key={i} className="rounded-lg border border-border overflow-hidden bg-background hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer group">
                      <div className="aspect-square overflow-hidden">
                        <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-1.5">
                        <p className="text-[10px] font-medium text-foreground truncate">{r.name}</p>
                        <p className="text-[10px] font-bold text-primary">{r.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button className="h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                    Смотреть все <ArrowRight size={12} />
                  </button>
                  <button onClick={reset} className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Заново
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right — CTA Block */}
          <div className="hidden md:flex flex-col justify-center items-center border-l border-border bg-primary/5 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-2">Найдите идеальный товар</h3>
            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
              Ответьте на 3 вопроса<br />и получите персональную подборку
            </p>
            <div className="space-y-2 mb-4 text-left w-full">
              {["Быстрый подбор", "Персональные рекомендации", "Лучшие цены"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle size={12} className="text-primary shrink-0" />
                  <span className="text-[11px] text-foreground">{t}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">
              5 000+ пользователей уже нашли свой товар
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductFinderQuiz;
