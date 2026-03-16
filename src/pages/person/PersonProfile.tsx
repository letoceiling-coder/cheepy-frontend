import { useState, useEffect, useRef } from "react";
import { MapPin, Pencil, Trash2, Plus, Copy, Check, X, Save, Camera } from "lucide-react";
import { mockUser } from "@/data/mock-data";
import { useAuth } from "@/contexts/AuthContext";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const PersonProfile = () => {
  const { user, isAuthenticated } = useAuth();
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const editFormRef = useRef<HTMLDivElement>(null);

  const displayUser = user || mockUser;

  // Edit form state
  const [editName, setEditName] = useState(displayUser.name);
  const [editEmail, setEditEmail] = useState(displayUser.email);
  const [editPhone, setEditPhone] = useState(displayUser.phone);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const copyRef = () => {
    navigator.clipboard.writeText(mockUser.referralCode);
    setCopied(true);
    toast({ title: "Скопировано", description: "Реферальный код скопирован в буфер обмена" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEdit = () => {
    if (!requireAuth("Редактирование профиля")) return;
    setEditing(prev => !prev);
  };

  const handleSave = () => {
    if (!requireAuth("Сохранить изменения")) return;
    setEditing(false);
    toast({ title: "Сохранено", description: "Профиль успешно обновлён" });
  };

  const handleSubscribe = () => {
    if (!requireAuth("Подписка на рассылку")) return;
    toast({ title: "Подписка оформлена", description: "Вы будете получать уведомления об акциях" });
  };

  const handleAddressAction = (action: string) => {
    if (!requireAuth(action)) return;
    toast({ title: action, description: "Действие выполнено успешно" });
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="space-y-8">
      {/* Profile header with avatar */}
      <section className="animate-fade-in">
        <div className="flex items-center gap-5 mb-6">
          {/* Avatar with hover glow */}
          <div className="relative group cursor-pointer" onClick={handleEdit}>
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl shadow-lg shadow-primary/20 transition-all duration-400 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/40 group-hover:rounded-xl">
              {displayUser.name?.[0] || "U"}
            </div>
            {/* Camera overlay */}
            <div className="absolute inset-0 rounded-2xl bg-foreground/0 group-hover:bg-foreground/20 transition-all duration-300 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-card flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-primary-foreground" />
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">{displayUser.name}</h2>
            <p className="text-sm text-muted-foreground">{displayUser.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Участник с 2024 года</p>
          </div>
          <button
            onClick={handleEdit}
            className={`p-2.5 rounded-xl border transition-all duration-300 ${
              editing
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5"
            }`}
          >
            {editing ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>

        {/* Slide-down edit form */}
        <div
          ref={editFormRef}
          className="overflow-hidden transition-all duration-400 ease-out"
          style={{
            maxHeight: editing ? "300px" : "0",
            opacity: editing ? 1 : 0,
            marginBottom: editing ? "1.5rem" : "0",
          }}
        >
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Редактирование профиля</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div>
                <label className="text-[11px] text-primary mb-1 block font-medium">Имя</label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-primary mb-1 block font-medium">E-mail</label>
                <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
              <div>
                <label className="text-[11px] text-primary mb-1 block font-medium">Телефон</label>
                <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} className="rounded-xl h-9 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm" className="gradient-primary text-primary-foreground rounded-xl px-5 text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
                <Save className="w-3 h-3 mr-1.5" /> Сохранить
              </Button>
              <Button onClick={() => setEditing(false)} variant="outline" size="sm" className="rounded-xl text-xs">
                Отмена
              </Button>
            </div>
          </div>
        </div>

        {/* Fields display */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatedField label="Имя" value={displayUser.name} delay={0} />
          <AnimatedField label="E-mail" value={displayUser.email} delay={50} />
          <AnimatedField label="Телефон" value={displayUser.phone} delay={100} />
        </div>
        <div className="mt-3">
          <AnimatedField label="Дата рождения" value="14.03.2000" delay={150} />
        </div>
      </section>

      {/* Delivery addresses */}
      <section className="animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground">Адрес доставки</h2>
          <button onClick={() => handleAddressAction("Добавить адрес")} className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 hover:scale-110 active:scale-95 transition-transform duration-200">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { type: "Домашний", country: "Россия", city: "Москва", street: "Большая Басманная", house: "206", apt: "12" },
            { type: "Рабочий", country: "Россия", city: "Москва", street: "Большая Басманная", house: "206", apt: "12" },
          ].map((addr, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 group animate-fade-in"
              style={{ animationDelay: `${200 + i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-foreground">{addr.type}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {addr.city}, ул. {addr.street}, д. {addr.house}, кв. {addr.apt}
              </p>
              <div className="grid grid-cols-3 gap-y-1 text-[11px] mb-3">
                <div><span className="text-muted-foreground">Страна</span></div>
                <div className="col-span-2 font-medium text-foreground">{addr.country}</div>
                <div><span className="text-muted-foreground">Город</span></div>
                <div className="col-span-2 font-medium text-foreground">{addr.city}</div>
              </div>
              <div className="flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-250">
                <button onClick={() => handleAddressAction("Адрес изменён")} className="text-xs text-primary hover:underline transition-colors">Изменить</button>
                <button onClick={() => handleAddressAction("Адрес удалён")} className="text-xs text-destructive hover:underline transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pickup points */}
      <section className="animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-bold text-foreground">Пункты выдачи</h2>
          <button onClick={() => handleAddressAction("Добавить пункт выдачи")} className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 hover:scale-110 active:scale-95 transition-transform duration-200">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mockUser.pvzAddresses.map((pvz, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 group animate-fade-in"
              style={{ animationDelay: `${350 + i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs font-semibold text-foreground">ТРЦ "Хорошо" — {pvz}</p>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2">
                Россия, Москва, ТРЦ "Хорошо", 1 этаж
              </p>
              <div className="flex gap-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-250">
                <button onClick={() => handleAddressAction("Адрес изменён")} className="text-xs text-primary hover:underline transition-colors">Изменить</button>
                <button onClick={() => handleAddressAction("Адрес удалён")} className="text-xs text-destructive hover:underline transition-colors flex items-center gap-1">
                  <Trash2 className="w-3 h-3" /> Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Referral code */}
      <section className="animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Реферальный код</h2>
        <div className="flex items-center gap-2 max-w-md">
          <div className="flex-1 relative">
            <Input readOnly value={mockUser.referralCode} className="pr-10 bg-secondary border-border rounded-xl font-mono text-sm" />
            <button
              onClick={copyRef}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20 hover:scale-110 active:scale-95 transition-transform duration-200"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2 max-w-lg">
          Поделитесь кодом с друзьями и получите бонусы за каждого приглашённого пользователя.
        </p>
      </section>

      {/* Newsletter */}
      <section className="animate-fade-in" style={{ animationDelay: "450ms", animationFillMode: "both" }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Будьте в курсе акций</h2>
        <div className="flex items-center gap-2 max-w-md">
          <Input placeholder="Ваш e-mail" className="rounded-xl" />
          <Button onClick={handleSubscribe} className="gradient-primary text-primary-foreground rounded-xl px-5 shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
            Подписаться
          </Button>
        </div>
        <label className="flex items-center gap-2 mt-2.5 text-[11px] text-muted-foreground cursor-pointer">
          <input type="checkbox" className="rounded border-border accent-primary" />
          Даю согласие на рассылку рекламных материалов
        </label>
      </section>

      {/* Social connections */}
      <section className="animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
        <h2 className="text-lg font-bold text-foreground mb-3">Социальные сети</h2>
        <div className="flex flex-wrap gap-2">
          {["Google", "Apple", "VK", "Telegram"].map((name, i) => (
            <button
              key={i}
              onClick={() => { if (requireAuth("Привязать " + name)) toast({ title: "Привязано" }); }}
              className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-2.5 min-w-[140px] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/20 group animate-fade-in"
              style={{ animationDelay: `${550 + i * 50}ms`, animationFillMode: "both" }}
            >
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground transition-transform duration-200 group-hover:scale-110">
                {name[0]}
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-foreground">{name}</p>
                <p className="text-[10px] text-primary">Привязать</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

const AnimatedField = ({ label, value, delay }: { label: string; value: string; delay: number }) => (
  <div className="animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}>
    <p className="text-[11px] text-primary mb-1 font-medium">{label}</p>
    <p className="text-sm font-medium text-foreground border-b border-border pb-2 transition-colors hover:border-primary/30">{value}</p>
  </div>
);

const ProfileSkeleton = () => (
  <div className="space-y-8">
    <div className="flex items-center gap-5">
      <Skeleton className="w-20 h-20 rounded-2xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[0,1,2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[0,1].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonProfile;
