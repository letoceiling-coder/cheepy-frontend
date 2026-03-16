import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";

const PersonPassword = () => {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [repeatPw, setRepeatPw] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { requireAuth } = useLoginPrompt();

  const strength = useMemo(() => {
    if (newPw.length === 0) return { pct: 0, label: "", color: "bg-secondary", textCls: "" };
    let score = 0;
    if (newPw.length >= 8) score++;
    if (/[A-Z]/.test(newPw)) score++;
    if (/[0-9]/.test(newPw)) score++;
    if (/[^A-Za-z0-9]/.test(newPw)) score++;
    if (score <= 1) return { pct: 25, label: "Слабый пароль", color: "bg-destructive", textCls: "text-destructive" };
    if (score === 2) return { pct: 50, label: "Средний пароль", color: "bg-amber-400", textCls: "text-amber-500" };
    if (score === 3) return { pct: 75, label: "Хороший пароль", color: "bg-primary/60", textCls: "text-primary" };
    return { pct: 100, label: "Надежный пароль", color: "gradient-primary", textCls: "text-primary" };
  }, [newPw]);

  const handleSubmit = () => {
    if (!requireAuth("Изменить пароль")) return;
    if (!oldPw || !newPw || !repeatPw) {
      toast({ title: "Ошибка", description: "Заполните все поля", variant: "destructive" });
      return;
    }
    if (newPw !== repeatPw) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setOldPw(""); setNewPw(""); setRepeatPw("");
      toast({ title: "Пароль изменён", description: "Новый пароль успешно установлен" });
    }, 1000);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Изменение пароля</h2>
        <button className="text-sm text-primary hover:underline transition-colors">Не помню старый пароль</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
        <div>
          <label className="text-xs text-primary mb-1 block">Старый пароль</label>
          <Input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-primary mb-1 block">Новый пароль</label>
          <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="rounded-xl" />
        </div>
        <div>
          <label className="text-xs text-primary mb-1 block">Повторите пароль</label>
          <Input type="password" value={repeatPw} onChange={e => setRepeatPw(e.target.value)} className="rounded-xl" />
        </div>
      </div>

      {newPw.length > 0 && (
        <div className="mt-3 max-w-xs animate-fade-in">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
          </div>
          <p className={`text-xs mt-1 transition-colors ${strength.textCls}`}>
            {strength.label}
          </p>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting}
        className="gradient-primary text-primary-foreground rounded-xl px-8 mt-6 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            Сохранение...
          </span>
        ) : "Изменить пароль"}
      </Button>
    </div>
  );
};

export default PersonPassword;
