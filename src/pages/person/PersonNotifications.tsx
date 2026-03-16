import { useState, useEffect } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Send } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

interface Channel {
  id: string;
  label: string;
  description: string;
  icon: typeof Mail;
  enabled: boolean;
}

const defaultChannels: Channel[] = [
  { id: "email", label: "E-mail", description: "Уведомления о заказах и акциях на почту", icon: Mail, enabled: true },
  { id: "sms", label: "SMS", description: "Важные уведомления по SMS", icon: Smartphone, enabled: false },
  { id: "push", label: "Push-уведомления", description: "Мгновенные уведомления в браузере", icon: Bell, enabled: true },
  { id: "telegram", label: "Telegram", description: "Уведомления через Telegram-бот", icon: Send, enabled: false },
];

const categories = [
  { id: "orders", label: "Заказы и доставка", enabled: true },
  { id: "promos", label: "Акции и скидки", enabled: true },
  { id: "reviews", label: "Отзывы и оценки", enabled: false },
  { id: "news", label: "Новости и обновления", enabled: false },
  { id: "price", label: "Изменения цен в избранном", enabled: true },
];

const PersonNotifications = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState(defaultChannels);
  const [cats, setCats] = useState(categories);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const toggleChannel = (id: string) => {
    if (!requireAuth("Изменить настройки уведомлений")) return;
    setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    toast({ title: "Настройки обновлены" });
  };

  const toggleCat = (id: string) => {
    if (!requireAuth("Изменить настройки уведомлений")) return;
    setCats(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    toast({ title: "Настройки обновлены" });
  };

  if (loading) return <NotifSkeleton />;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-foreground mb-2">Уведомления</h2>
      <p className="text-sm text-muted-foreground mb-6">Настройте каналы и типы уведомлений</p>

      {/* Channels */}
      <h3 className="font-semibold text-foreground mb-3">Каналы</h3>
      <div className="space-y-2 mb-8">
        {channels.map((ch, i) => (
          <div
            key={ch.id}
            className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/20 hover:shadow-sm animate-fade-in"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${ch.enabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"} transition-colors`}>
                <ch.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{ch.label}</p>
                <p className="text-xs text-muted-foreground">{ch.description}</p>
              </div>
            </div>
            <Switch checked={ch.enabled} onCheckedChange={() => toggleChannel(ch.id)} />
          </div>
        ))}
      </div>

      {/* Categories */}
      <h3 className="font-semibold text-foreground mb-3">Типы уведомлений</h3>
      <div className="space-y-2">
        {cats.map((cat, i) => (
          <div
            key={cat.id}
            className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/20 animate-fade-in"
            style={{ animationDelay: `${(channels.length + i) * 60}ms`, animationFillMode: "both" }}
          >
            <span className="text-sm text-foreground">{cat.label}</span>
            <Switch checked={cat.enabled} onCheckedChange={() => toggleCat(cat.id)} />
          </div>
        ))}
      </div>
    </div>
  );
};

const NotifSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-7 w-40" />
    <div className="space-y-2">
      {[0,1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonNotifications;
