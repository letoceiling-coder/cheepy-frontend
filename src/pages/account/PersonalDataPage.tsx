import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Save, MapPin, Plus, Trash2, Loader2 } from "lucide-react";
import { storeAccountApi, type AccountAddress, type AccountPickupPoint, type AccountSummary } from "@/lib/api";
import { toast } from "sonner";

const PersonalDataPage = () => {
  const { user, isAuthenticated, refreshProfile } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [birthday, setBirthday] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pvzCityCode, setPvzCityCode] = useState("");
  const [pvzResults, setPvzResults] = useState<AccountPickupPoint[]>([]);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const data = await storeAccountApi.summary();
      setSummary(data);
      setName(data.profile.name || "");
      setEmail(data.profile.email || "");
      setPhone(data.profile.phone || "");
      setBirthday(data.profile.birthday || "");
      setSubscribed(Boolean(data.profile.marketing_opt_in));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось загрузить профиль");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isAuthenticated]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await storeAccountApi.updateProfile({ name, email, phone, birthday, marketing_opt_in: subscribed });
      await refreshProfile();
      toast.success("Профиль сохранён");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить профиль");
    } finally {
      setSaving(false);
    }
  };

  const addAddress = async () => {
    if (!addressText.trim() || !city.trim()) {
      toast.error("Укажите город и адрес");
      return;
    }
    await storeAccountApi.createAddress({ city: city.trim(), line1: addressText.trim(), source: suggestions.includes(addressText) ? "yandex" : "manual" });
    setAddressText("");
    setCity("");
    setSuggestions([]);
    toast.success("Адрес добавлен");
    void load();
  };

  const suggestAddress = async (value: string) => {
    setAddressText(value);
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await storeAccountApi.addressSuggest(value);
      setSuggestions(res.enabled ? res.data.map((x) => x.address).filter(Boolean) : []);
    } catch {
      setSuggestions([]);
    }
  };

  const deleteAddress = async (addr: AccountAddress) => {
    await storeAccountApi.deleteAddress(addr.id);
    toast.success("Адрес удалён");
    void load();
  };

  const searchPvz = async () => {
    const res = await storeAccountApi.searchPickupPoints({ city_code: pvzCityCode.trim() });
    if (!res.enabled) {
      toast.info(res.message || "СДЭК не активирован");
    }
    setPvzResults(res.data);
  };

  const savePvz = async (p: AccountPickupPoint) => {
    await storeAccountApi.createPickupPoint({
      provider: p.provider,
      office_code: p.office_code,
      name: p.name,
      city: p.city,
      address: p.address,
      lat: p.lat,
      lng: p.lng,
      work_time: p.work_time,
      provider_payload: p.raw as never,
    });
    toast.success("ПВЗ сохранён");
    void load();
  };

  const deletePvz = async (p: AccountPickupPoint) => {
    await storeAccountApi.deletePickupPoint(p.id);
    toast.success("ПВЗ удалён");
    void load();
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border p-6">
        <h2 className="text-xl font-bold text-foreground mb-2">Личный кабинет</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Войдите или зарегистрируйтесь, чтобы управлять адресами, заказами, оплатой, балансом, купонами и реферальной программой.
        </p>
        <Button asChild className="gradient-primary text-primary-foreground rounded-lg">
          <a href="/auth">Войти</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">Личные данные</h2>
      {loading && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Загрузка профиля…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Имя</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Телефон</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Дата рождения</label>
          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
            className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary" />
        </div>
      </div>

      {/* Addresses */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Адреса доставки</h3>
        <div className="space-y-2">
          {(summary?.addresses ?? []).map((addr) => (
            <div key={addr.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground flex-1">{addr.city}, {addr.line1}</span>
              <button onClick={() => void deleteAddress(addr)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город" className="py-2.5 px-4 rounded-lg border border-border bg-background text-sm" />
            <div className="relative">
              <input value={addressText} onChange={(e) => void suggestAddress(e.target.value)} placeholder="Адрес доставки" className="w-full py-2.5 px-4 rounded-lg border border-border bg-background text-sm" />
              {suggestions.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-popover shadow">
                  {suggestions.slice(0, 5).map((s) => (
                    <button key={s} onClick={() => { setAddressText(s); setSuggestions([]); }} className="block w-full px-3 py-2 text-left text-xs hover:bg-secondary">{s}</button>
                  ))}
                </div>
              )}
            </div>
            <Button type="button" variant="outline" onClick={() => void addAddress()} className="rounded-lg gap-2"><Plus className="w-4 h-4" />Добавить</Button>
          </div>
        </div>
      </div>

      {/* PVZ */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Адреса ПВЗ</h3>
        <div className="space-y-2">
          {(summary?.pickup_points ?? []).map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground flex-1">{p.name ? `${p.name}: ` : ""}{p.address}</span>
              <button onClick={() => void deletePvz(p)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          <div className="flex gap-2">
            <input value={pvzCityCode} onChange={(e) => setPvzCityCode(e.target.value)} placeholder="Код города СДЭК" className="py-2.5 px-4 rounded-lg border border-border bg-background text-sm" />
            <Button type="button" variant="outline" onClick={() => void searchPvz()}>Найти ПВЗ</Button>
          </div>
          {pvzResults.map((p) => (
            <button key={`${p.provider}-${p.office_code}`} onClick={() => void savePvz(p)} className="block w-full p-3 rounded-xl border border-border text-left hover:border-primary">
              <span className="block text-sm font-medium">{p.name || p.office_code}</span>
              <span className="block text-xs text-muted-foreground">{p.address}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Реферальный код</h3>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5">
          <span className="text-sm font-mono font-bold text-primary">{summary?.referral.code ?? "—"}</span>
          <button onClick={() => summary?.referral.code && navigator.clipboard.writeText(summary.referral.link)} className="text-xs text-primary hover:underline">Копировать ссылку</button>
        </div>
      </div>

      {/* Subscribe */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={subscribed} onChange={e => setSubscribed(e.target.checked)}
          className="rounded border-border text-primary focus:ring-primary" />
        <span className="text-sm text-foreground">Подписка на акции и скидки</span>
      </label>

      {/* Social */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Социальные сети</h3>
        <div className="flex gap-3">
          {(summary?.integrations.social ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Активных интеграций соцсетей нет.</p>
          ) : summary?.integrations.social.map(s => (
            <button key={s} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              Привязать {s}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={() => void saveProfile()} disabled={saving} className="gradient-primary text-primary-foreground rounded-lg gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Сохранить изменения
      </Button>
    </div>
  );
};

export default PersonalDataPage;
