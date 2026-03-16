import { useState, useEffect } from "react";
import { MessageCircle, FileText, HelpCircle, Clock, ChevronRight, Send, Plus } from "lucide-react";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const faqItems = [
  { q: "Как отследить заказ?", a: "Перейдите в раздел «Мои заказы» и нажмите «Отследить» напротив нужного заказа." },
  { q: "Как оформить возврат?", a: "Перейдите в раздел «Возвраты» и выберите нужный тип возврата." },
  { q: "Как изменить адрес доставки?", a: "Откройте раздел «Адреса» и отредактируйте нужный адрес." },
  { q: "Как привязать карту?", a: "Перейдите в «Способы оплаты» и добавьте новую карту." },
];

const mockTickets = [
  { id: "T-001", subject: "Повреждённый товар", status: "open", date: "2025-01-15" },
  { id: "T-002", subject: "Не пришёл заказ", status: "resolved", date: "2024-12-28" },
];

const PersonSupport = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<{ from: "bot" | "user"; text: string }[]>([
    { from: "bot", text: "Здравствуйте! Чем могу помочь?" },
  ]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    if (!requireAuth("Отправить сообщение в поддержку")) return;
    setMessages(prev => [...prev, { from: "user" as const, text: chatMsg }]);
    setChatMsg("");
    setTimeout(() => {
      setMessages(prev => [...prev, { from: "bot" as const, text: "Спасибо за обращение! Оператор ответит в ближайшее время." }]);
    }, 1000);
  };

  const handleNewTicket = () => {
    if (!requireAuth("Создать обращение")) return;
    toast({ title: "Обращение создано" });
  };

  if (loading) return <SupportSkeleton />;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-foreground mb-6">Центр поддержки</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chat */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Онлайн-чат</span>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="h-[240px] overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                  m.from === "user"
                    ? "gradient-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Введите сообщение..."
              className="rounded-xl text-xs h-9"
            />
            <Button onClick={sendMessage} size="sm" className="gradient-primary text-primary-foreground rounded-xl px-3">
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* FAQ */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Частые вопросы</h3>
          </div>
          <div className="space-y-2">
            {faqItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-primary/20">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left p-3 flex items-center justify-between text-sm font-medium text-foreground"
                >
                  {item.q}
                  <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                <div
                  className="overflow-hidden transition-all duration-300"
                  style={{ maxHeight: openFaq === i ? "100px" : "0", opacity: openFaq === i ? 1 : 0 }}
                >
                  <p className="px-3 pb-3 text-xs text-muted-foreground">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tickets */}
      <div className="mt-8 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-foreground">Мои обращения</h3>
          </div>
          <Button onClick={handleNewTicket} size="sm" variant="outline" className="rounded-xl text-xs">
            <Plus className="w-3 h-3 mr-1" /> Новое обращение
          </Button>
        </div>
        <div className="space-y-2">
          {mockTickets.map((t, i) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:border-primary/20 hover:shadow-sm transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${300 + i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-muted-foreground">{t.id}</span>
                <span className="text-sm text-foreground">{t.subject}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  t.status === "open" ? "bg-primary/10 text-primary" : "bg-emerald-500/10 text-emerald-600"
                }`}>
                  {t.status === "open" ? "Открыт" : "Решён"}
                </span>
                <span className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString("ru-RU")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SupportSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-7 w-48" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Skeleton className="h-[360px] rounded-2xl" />
      <Skeleton className="h-[360px] rounded-2xl" />
    </div>
  </div>
);

export default PersonSupport;
