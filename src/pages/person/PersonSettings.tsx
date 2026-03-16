import { useState, useEffect } from "react";
import { Settings, Globe, Palette, Moon, Sun, Trash2, Download } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PersonSettings = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("ru");
  const [currency, setCurrency] = useState("RUB");

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const handleSave = (label: string) => {
    if (!requireAuth(label)) return;
    toast({ title: "Настройки сохранены" });
  };

  const handleExport = () => {
    if (!requireAuth("Экспорт данных")) return;
    toast({ title: "Данные экспортированы", description: "Файл будет отправлен на вашу почту" });
  };

  const handleDeleteAccount = () => {
    if (!requireAuth("Удалить аккаунт")) return;
    toast({ title: "Запрос отправлен", description: "Мы обработаем запрос на удаление в течение 30 дней", variant: "destructive" });
  };

  if (loading) return <SettingsSkeleton />;

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-xl font-bold text-foreground">Настройки</h2>

      {/* Appearance */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Внешний вид</h3>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all duration-200">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <div>
              <p className="text-sm font-medium text-foreground">Тёмная тема</p>
              <p className="text-xs text-muted-foreground">Переключить цветовую схему</p>
            </div>
          </div>
          <Switch checked={darkMode} onCheckedChange={(v) => { setDarkMode(v); handleSave("Сменить тему"); }} />
        </div>
      </section>

      {/* Language & Currency */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Региональные настройки</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border border-border bg-card">
            <label className="text-xs text-primary mb-2 block font-medium">Язык</label>
            <select
              value={language}
              onChange={e => { setLanguage(e.target.value); handleSave("Изменить язык"); }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/30"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="kz">Қазақша</option>
            </select>
          </div>
          <div className="p-4 rounded-2xl border border-border bg-card">
            <label className="text-xs text-primary mb-2 block font-medium">Валюта</label>
            <select
              value={currency}
              onChange={e => { setCurrency(e.target.value); handleSave("Изменить валюту"); }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/30"
            >
              <option value="RUB">₽ Рубль</option>
              <option value="USD">$ Доллар</option>
              <option value="EUR">€ Евро</option>
              <option value="KZT">₸ Тенге</option>
            </select>
          </div>
        </div>
      </section>

      {/* Data */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Данные аккаунта</h3>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200 text-left"
          >
            <Download className="w-4 h-4 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Экспорт данных</p>
              <p className="text-xs text-muted-foreground">Скачать все данные вашего аккаунта</p>
            </div>
          </button>
          <button
            onClick={handleDeleteAccount}
            className="flex items-center gap-3 w-full p-4 rounded-2xl border border-destructive/20 bg-destructive/[0.02] hover:border-destructive/40 hover:bg-destructive/5 transition-all duration-200 text-left"
          >
            <Trash2 className="w-4 h-4 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Удалить аккаунт</p>
              <p className="text-xs text-muted-foreground">Безвозвратное удаление всех данных</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

const SettingsSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-7 w-32" />
    <Skeleton className="h-16 rounded-2xl" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[0,1].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
    </div>
    <div className="space-y-3">
      {[0,1].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonSettings;
