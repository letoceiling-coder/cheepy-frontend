import { useState } from "react";
import { ArrowRight, ArrowLeft, Zap, Mail, MessageCircle, Bell, Shirt, Laptop, Watch, Home } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  {
    question: "Хотите получать специальные предложения?",
    options: [
      { label: "Да, все предложения", icon: Zap },
      { label: "Только скидки", icon: Zap },
      { label: "Только новинки", icon: Zap },
    ],
  },
  {
    question: "Какие категории вас интересуют?",
    multi: true,
    options: [
      { label: "Одежда", icon: Shirt },
      { label: "Электроника", icon: Laptop },
      { label: "Аксессуары", icon: Watch },
      { label: "Для дома", icon: Home },
    ],
  },
  {
    question: "Как удобнее получать предложения?",
    options: [
      { label: "Email", icon: Mail },
      { label: "Telegram", icon: MessageCircle },
      { label: "Push-уведомления", icon: Bell },
    ],
  },
];

const DealDiscoveryQuiz = () => {
  const { ref, isVisible } = useScrollAnimation();
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[][]>([]);
  const [multiPicks, setMultiPicks] = useState<string[]>([]);
  const done = step >= steps.length;
  const progress = done ? 100 : (step / steps.length) * 100;

  const pick = (label: string) => {
    const current = steps[step];
    if ((current as any).multi) {
      setMultiPicks((p) => p.includes(label) ? p.filter((x) => x !== label) : [...p, label]);
    } else {
      setSelected([...selected, [label]]);
      setStep(step + 1);
    }
  };

  const confirmMulti = () => {
    if (multiPicks.length === 0) return;
    setSelected([...selected, multiPicks]);
    setMultiPicks([]);
    setStep(step + 1);
  };

  const back = () => {
    if (step === 0) return;
    setStep(step - 1);
    setSelected(selected.slice(0, -1));
    setMultiPicks([]);
  };

  const reset = () => { setStep(0); setSelected([]); setMultiPicks([]); };

  const currentStep = steps[step];
  const isMulti = currentStep && (currentStep as any).multi;

  return (
    <section ref={ref} className={`py-8 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      <div className="rounded-xl border border-border bg-card p-5 md:p-7 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={16} className="text-primary" />
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Эксклюзив</span>
        </div>
        <h2 className="text-lg font-bold text-foreground mb-4">Откройте эксклюзивные предложения</h2>

        <div className="h-1.5 rounded-full bg-secondary mb-5 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
        </div>

        {!done ? (
          <div key={step} className="animate-fade-in">
            <p className="text-xs text-muted-foreground mb-3">Шаг {step + 1} из {steps.length}</p>
            <p className="text-sm font-semibold text-foreground mb-4">{currentStep.question}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currentStep.options.map((opt) => {
                const Icon = opt.icon;
                const active = isMulti && multiPicks.includes(opt.label);
                return (
                  <button
                    key={opt.label}
                    onClick={() => pick(opt.label)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 cursor-pointer group ${
                      active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                    }`}
                  >
                    <Icon size={18} className={`transition-colors ${active ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                    <span className="text-xs font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-4">
              {step > 0 && (
                <button onClick={back} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft size={12} /> Назад
                </button>
              )}
              {isMulti && (
                <button
                  onClick={confirmMulti}
                  disabled={multiPicks.length === 0}
                  className="ml-auto h-8 px-4 gradient-primary text-primary-foreground rounded-lg font-semibold text-xs flex items-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Далее <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in text-center py-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Zap size={24} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-2">Теперь у вас есть доступ к эксклюзивным предложениям!</p>
            <p className="text-xs text-muted-foreground mb-4">Мы подберём лучшие скидки и новинки специально для вас</p>
            <div className="flex justify-center gap-2">
              <button className="h-9 px-5 gradient-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
                Получить скидки <ArrowRight size={14} />
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

export default DealDiscoveryQuiz;
