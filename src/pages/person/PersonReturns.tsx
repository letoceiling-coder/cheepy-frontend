import { RotateCcw, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

const PersonReturns = () => {
  const { toast } = useToast();
  const { requireAuth } = useLoginPrompt();

  const handleSelect = (type: string) => {
    if (!requireAuth(type)) return;
    toast({ title: "Выбрано", description: `Вы выбрали: ${type}` });
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-foreground mb-2">Условия возврата</h2>
      <p className="text-sm text-muted-foreground mb-6">Выберите один из вариантов, который Вас интересует</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleSelect("Возврат товаров")}
          className="rounded-2xl border-2 border-border bg-card p-6 text-left transition-all duration-250 hover:-translate-y-[3px] hover:shadow-lg hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Возврат товаров</h3>
          <div className="flex gap-2 mb-6">
            <RotateCcw className="w-8 h-8 text-primary" />
            <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm text-primary group-hover:underline transition-colors">Меня интересует возврат товаров</p>
        </button>

        <button
          onClick={() => handleSelect("Возврат денежных средств")}
          className="rounded-2xl border-2 border-border bg-card p-6 text-left transition-all duration-250 hover:-translate-y-[3px] hover:shadow-lg hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98] group"
        >
          <h3 className="text-lg font-bold text-foreground mb-4">Возврат денежных средств</h3>
          <div className="flex gap-2 mb-6">
            <RotateCcw className="w-8 h-8 text-primary" />
            <Banknote className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-sm text-primary group-hover:underline transition-colors">Меня интересует возврат денежных средств</p>
        </button>
      </div>
    </div>
  );
};

export default PersonReturns;
