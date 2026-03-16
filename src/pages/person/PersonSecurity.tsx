import { useState, useEffect, useMemo } from "react";
import { Shield, Smartphone, Monitor, Globe, KeyRound, Lock, Unlock } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const sessions = [
  { id: "1", device: "Chrome — Windows 10", icon: Monitor, ip: "95.24.xxx.xxx", location: "Москва", active: true, lastSeen: "Сейчас" },
  { id: "2", device: "Safari — iPhone 15", icon: Smartphone, ip: "95.24.xxx.xxx", location: "Москва", active: false, lastSeen: "2 часа назад" },
  { id: "3", device: "Firefox — macOS", icon: Globe, ip: "178.16.xxx.xxx", location: "Санкт-Петербург", active: false, lastSeen: "3 дня назад" },
];

const PersonSecurity = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [twoFA, setTwoFA] = useState(false);

  // Password change
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [repeatPw, setRepeatPw] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const strength = useMemo(() => {
    if (newPw.length === 0) return { pct: 0, label: "", color: "bg-secondary", textCls: "" };
    let score = 0;
    if (newPw.length >= 8) score++;
    if (/[A-Z]/.test(newPw)) score++;
    if (/[0-9]/.test(newPw)) score++;
    if (/[^A-Za-z0-9]/.test(newPw)) score++;
    if (score <= 1) return { pct: 25, label: "Слабый", color: "bg-destructive", textCls: "text-destructive" };
    if (score === 2) return { pct: 50, label: "Средний", color: "bg-amber-400", textCls: "text-amber-500" };
    if (score === 3) return { pct: 75, label: "Хороший", color: "bg-primary/60", textCls: "text-primary" };
    return { pct: 100, label: "Надежный", color: "gradient-primary", textCls: "text-primary" };
  }, [newPw]);

  const handleChangePassword = () => {
    if (!requireAuth("Изменить пароль")) return;
    if (!oldPw || !newPw || !repeatPw) { toast({ title: "Заполните все поля", variant: "destructive" }); return; }
    if (newPw !== repeatPw) { toast({ title: "Пароли не совпадают", variant: "destructive" }); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setOldPw(""); setNewPw(""); setRepeatPw("");
      toast({ title: "Пароль изменён" });
    }, 1000);
  };

  const toggle2FA = () => {
    if (!requireAuth("Настроить двухфакторную аутентификацию")) return;
    setTwoFA(!twoFA);
    toast({ title: twoFA ? "2FA отключена" : "2FA включена" });
  };

  const terminateSession = (id: string) => {
    if (!requireAuth("Завершить сессию")) return;
    toast({ title: "Сессия завершена" });
  };

  if (loading) return <SecuritySkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground">Безопасность</h2>

      {/* Password */}
      <section className="animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Изменение пароля</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl">
          <div>
            <label className="text-xs text-primary mb-1 block">Старый пароль</label>
            <Input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-primary mb-1 block">Новый пароль</label>
            <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-primary mb-1 block">Повторите</label>
            <Input type="password" value={repeatPw} onChange={e => setRepeatPw(e.target.value)} className="rounded-xl" />
          </div>
        </div>
        {newPw.length > 0 && (
          <div className="mt-2 max-w-xs">
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
            </div>
            <p className={`text-xs mt-1 ${strength.textCls}`}>{strength.label}</p>
          </div>
        )}
        <Button onClick={handleChangePassword} disabled={submitting} className="gradient-primary text-primary-foreground rounded-xl px-6 mt-4 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60">
          {submitting ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Сохранение...</span> : "Изменить пароль"}
        </Button>
      </section>

      {/* 2FA */}
      <section className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${twoFA ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"} transition-colors`}>
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Двухфакторная аутентификация (2FA)</p>
              <p className="text-xs text-muted-foreground">Дополнительная защита аккаунта через SMS или приложение</p>
            </div>
          </div>
          <Switch checked={twoFA} onCheckedChange={toggle2FA} />
        </div>
      </section>

      {/* Active sessions */}
      <section className="animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-3">
          <Monitor className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Активные сессии</h3>
        </div>
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${300 + i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  <s.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.device}</p>
                  <p className="text-[10px] text-muted-foreground">{s.ip} • {s.location} • {s.lastSeen}</p>
                </div>
              </div>
              {s.active ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Текущая
                </span>
              ) : (
                <button onClick={() => terminateSession(s.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Завершить
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const SecuritySkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-7 w-40" />
    <div className="space-y-3">
      <Skeleton className="h-10 w-full max-w-3xl rounded-xl" />
      <Skeleton className="h-10 w-full max-w-3xl rounded-xl" />
    </div>
    <Skeleton className="h-16 rounded-2xl" />
    <div className="space-y-2">
      {[0,1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
  </div>
);

export default PersonSecurity;
