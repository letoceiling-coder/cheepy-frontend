import { useState } from "react";
import { ArrowRight, ArrowLeft, Palette } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useQuizScrollIntoView } from "@/hooks/useQuizScrollIntoView";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import look1 from "@/assets/look-1.jpg";
import product1 from "@/assets/product-1.jpg";
import product2 from "@/assets/product-2.jpg";
import product3 from "@/assets/product-3.jpg";

const steps = [
  {
    question: "Выберите стиль",
    type: "image" as const,
    options: [
      { label: "Минимализм", image: hero1 },
      { label: "Уличный", image: hero2 },
      { label: "Люкс", image: look1 },
      { label: "Кэжуал", image: hero3 },
    ],
  },
  {
    question: "Когда планируете использовать?",
    type: "text" as const,
    options: [
      { label: "На каждый день" },
      { label: "Для работы" },
      { label: "Путешествия" },
      { label: "В подарок" },
    ],
  },
  {
    question: "Выберите цветовую палитру",
    type: "color" as const,
    options: [
      { label: "Монохром", colors: ["#1a1a1a", "#4a4a4a", "#8a8a8a", "#d4d4d4"] },
      { label: "Тёплые", colors: ["#8B4513", "#D2691E", "#F4A460", "#FFDAB9"] },
      { label: "Холодные", colors: ["#1e3a5f", "#4682B4", "#87CEEB", "#E0F0FF"] },
      { label: "Яркие", colors: ["#DC143C", "#FF6347", "#FFD700", "#32CD32"] },
    ],
  },
];

const results = [
  { name: "Пальто классик", price: "8 990 ₽", image: product1 },
  { name: "Брюки слим", price: "3 490 ₽", image: product2 },
  { name: "Ботинки кожа", price: "6 990 ₽", image: product3 },
];

const StyleMatchQuiz = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const done = step >= steps.length;
  const progress = done ? 100 : (step / steps.length) * 100;

  const pick = (label: string) => {
    setAnswers([...answers, label]);
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep(step - 1);
    setAnswers(answers.slice(0, -1));
  };

  const reset = () => { setStep(0); setAnswers([]); };

  const current = steps[step];

  useQuizScrollIntoView(ref, step, done);

  return (
    <section ref={ref} className={`py-8 scroll-mt-24 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card p-5 md:p-7 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Palette size={16} className="text-primary" />
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Стиль-матч</span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-4">Найдите товары под ваш стиль</h2>

        <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {!done ? (
          <div key={step} className="animate-fade-in min-h-[200px] transition-all duration-300">
            <p className="text-xs text-muted-foreground mb-3">Шаг {step + 1} из {steps.length}</p>
            <p className="text-sm font-semibold text-foreground mb-4">{current.question}</p>

            {current.type === "image" && (
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((opt) => (
                  <button key={opt.label} onClick={() => pick(opt.label)} className="rounded-lg border border-border overflow-hidden bg-background hover:border-primary/40 transition-all duration-200 cursor-pointer group">
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={(opt as any).image} alt={opt.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    </div>
                    <div className="p-2.5">
                      <span className="text-xs font-medium text-foreground">{opt.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {current.type === "text" && (
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((opt) => (
                  <button key={opt.label} onClick={() => pick(opt.label)} className="p-3.5 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer text-center">
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {current.type === "color" && (
              <div className="grid grid-cols-2 gap-2">
                {current.options.map((opt) => (
                  <button key={opt.label} onClick={() => pick(opt.label)} className="p-3 rounded-lg border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-pointer group">
                    <div className="flex gap-1 mb-2 justify-center">
                      {(opt as any).colors.map((c: string, ci: number) => (
                        <div key={ci} className="w-7 h-7 rounded-full border border-border transition-transform duration-200 group-hover:scale-110" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step > 0 && (
              <button onClick={back} className="mt-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={12} /> Назад
              </button>
            )}
          </div>
        ) : (
          <div className="animate-fade-in text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Palette size={24} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">Ваша подборка готова!</p>
            <p className="text-xs text-muted-foreground mb-4">Стиль: {answers[0]} · {answers[1]} · {answers[2]}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {results.map((r, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden bg-background group">
                  <div className="aspect-square overflow-hidden">
                    <img src={r.image} alt={r.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-[11px] font-bold text-primary">{r.price}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              <button className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                Смотреть коллекцию <ArrowRight size={14} />
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

export default StyleMatchQuiz;
