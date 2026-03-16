import { useState, useEffect } from "react";
import { MapPin, Plus, Pencil, Trash2, Check, Star } from "lucide-react";
import { mockUser } from "@/data/mock-data";
import { useLoginPrompt } from "@/contexts/LoginPromptContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Address {
  id: string;
  type: string;
  city: string;
  street: string;
  house: string;
  apt: string;
  isDefault: boolean;
}

const initialAddresses: Address[] = [
  { id: "1", type: "Домашний", city: "Москва", street: "ул. Пушкина", house: "10", apt: "5", isDefault: true },
  { id: "2", type: "Рабочий", city: "Москва", street: "ул. Ленина", house: "25", apt: "301", isDefault: false },
  { id: "3", type: "Дача", city: "Подольск", street: "ул. Садовая", house: "7", apt: "", isDefault: false },
];

const PersonAddresses = () => {
  const { requireAuth } = useLoginPrompt();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState(initialAddresses);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const handleDelete = (id: string) => {
    if (!requireAuth("Удалить адрес")) return;
    setAddresses(prev => prev.filter(a => a.id !== id));
    toast({ title: "Адрес удалён" });
  };

  const handleSetDefault = (id: string) => {
    if (!requireAuth("Установить адрес по умолчанию")) return;
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    toast({ title: "Адрес по умолчанию обновлён" });
  };

  const handleAdd = () => {
    if (!requireAuth("Добавить адрес")) return;
    setShowAdd(prev => !prev);
  };

  const handleSaveNew = () => {
    if (!requireAuth("Сохранить адрес")) return;
    setShowAdd(false);
    toast({ title: "Адрес добавлен" });
  };

  if (loading) return <AddressesSkeleton />;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-foreground">Мои адреса</h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{addresses.length}</span>
        </div>
        <Button onClick={handleAdd} size="sm" className="gradient-primary text-primary-foreground rounded-xl text-xs shadow-md shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200">
          <Plus className="w-3 h-3 mr-1.5" /> Добавить
        </Button>
      </div>

      {/* Add form */}
      <div
        className="overflow-hidden transition-all duration-400 ease-out"
        style={{ maxHeight: showAdd ? "300px" : "0", opacity: showAdd ? 1 : 0, marginBottom: showAdd ? "1rem" : "0" }}
      >
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Новый адрес</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input placeholder="Город" className="rounded-xl h-9 text-sm" />
            <Input placeholder="Улица" className="rounded-xl h-9 text-sm" />
            <Input placeholder="Дом" className="rounded-xl h-9 text-sm" />
            <Input placeholder="Квартира" className="rounded-xl h-9 text-sm" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveNew} size="sm" className="gradient-primary text-primary-foreground rounded-xl text-xs">Сохранить</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline" size="sm" className="rounded-xl text-xs">Отмена</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addresses.map((addr, i) => (
          <div
            key={addr.id}
            className={`rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group animate-fade-in ${
              addr.isDefault ? "border-primary/30 bg-primary/[0.02]" : "border-border hover:border-primary/20"
            }`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${addr.isDefault ? "bg-primary/10" : "bg-secondary"}`}>
                  <MapPin className={`w-3.5 h-3.5 ${addr.isDefault ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className="text-xs font-semibold text-foreground">{addr.type}</span>
                {addr.isDefault && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> По умолчанию
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-foreground mb-1">{addr.city}, {addr.street}, д. {addr.house}{addr.apt ? `, кв. ${addr.apt}` : ""}</p>
            <div className="flex gap-3 mt-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-250">
              {!addr.isDefault && (
                <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <Star className="w-3 h-3" /> По умолчанию
                </button>
              )}
              <button onClick={() => { if (requireAuth("Редактировать адрес")) toast({ title: "Редактирование" }); }} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                <Pencil className="w-3 h-3" /> Изменить
              </button>
              <button onClick={() => handleDelete(addr.id)} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AddressesSkeleton = () => (
  <div className="space-y-5">
    <div className="flex items-center gap-3">
      <Skeleton className="h-7 w-36" />
      <Skeleton className="h-6 w-8 rounded-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
    </div>
  </div>
);

export default PersonAddresses;
