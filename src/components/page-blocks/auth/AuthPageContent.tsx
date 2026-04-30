import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User as UserIcon } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { publicSmsAuthApi, publicSocialAuthApi, type SocialAuthMetaProvider } from "@/lib/api";
import { toast } from "sonner";
import { SOCIAL_ORDER, SOCIAL_UI } from "@/components/auth/storefrontSocial";

type AuthMode = "login" | "register" | "recovery";
type LoginTab = "email" | "phone";

export default function AuthPageContent() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [loginTab, setLoginTab] = useState<LoginTab>("email");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [socialProviders, setSocialProviders] = useState<SocialAuthMetaProvider[]>([]);
  const [phoneAuthEnabled, setPhoneAuthEnabled] = useState(false);
  const [authMetaLoaded, setAuthMetaLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([publicSocialAuthApi.meta(), publicSmsAuthApi.meta()])
      .then(([soc, sms]) => {
        if (cancelled) return;
        setSocialProviders(soc.providers ?? []);
        setPhoneAuthEnabled(sms.phone_auth_enabled === true);
        setAuthMetaLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSocialProviders([]);
          setPhoneAuthEnabled(false);
          setAuthMetaLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (authMetaLoaded && !phoneAuthEnabled && loginTab === "phone") {
      setLoginTab("email");
    }
  }, [authMetaLoaded, phoneAuthEnabled, loginTab]);

  useEffect(() => {
    const err = searchParams.get("social_error");
    if (err) {
      toast.error(decodeURIComponent(err.replace(/\+/g, " ")));
      const next = new URLSearchParams(searchParams);
      next.delete("social_error");
      next.delete("social_login");
      next.delete("social_ok");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const passwordStrength = (p: string) => {
    let s = 0;
    if (p.length >= 6) s++;
    if (p.length >= 10) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ["", "Слабый", "Слабый", "Средний", "Хороший", "Отличный"][strength];
  const strengthColor = ["", "bg-destructive", "bg-destructive", "bg-yellow-500", "bg-green-500", "bg-green-600"][strength];

  const sortedSocialProviders = [...socialProviders].sort(
    (a, b) => SOCIAL_ORDER.indexOf(a.id as (typeof SOCIAL_ORDER)[number]) - SOCIAL_ORDER.indexOf(b.id as (typeof SOCIAL_ORDER)[number])
  );

  const socialSection =
    sortedSocialProviders.length > 0 ? (
      <div className="space-y-3">
        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-border flex-1" />
          <span className="px-3 text-sm text-muted-foreground">или</span>
          <div className="border-t border-border flex-1" />
        </div>
        <div
          className={`grid gap-3 ${sortedSocialProviders.length >= 3 ? "grid-cols-1 sm:grid-cols-3" : sortedSocialProviders.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
        >
          {sortedSocialProviders.map((p) => {
            const ui = SOCIAL_UI[p.id];
            if (!ui || !p.start_url) return null;
            const Icon = ui.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  window.location.href = p.start_url!;
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer ${ui.bg} ${ui.text}`}
              >
                <Icon />
                {ui.label}
              </button>
            );
          })}
        </div>
      </div>
    ) : null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const identifier = loginTab === "email" ? email.trim() : phone.trim();
      await login(identifier, password);
      navigate("/");
    } catch {
      /* toast в AuthContext */
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email.trim(), phoneAuthEnabled ? phone.trim() : "", password);
      navigate("/");
    } catch {
      /* toast в AuthContext */
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setMode("login");
  };

  const loginTabsConfig = phoneAuthEnabled
    ? [
        { key: "email" as LoginTab, icon: Mail, label: "Email" },
        { key: "phone" as LoginTab, icon: Phone, label: "Телефон" },
      ]
    : [{ key: "email" as LoginTab, icon: Mail, label: "Email" }];

  return (
    <div className="max-w-[440px] mx-auto w-full">
      {mode === "login" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Вход</h1>

          {loginTabsConfig.length > 1 ? (
            <div className="flex rounded-lg bg-secondary p-1 mb-6">
              {loginTabsConfig.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setLoginTab(t.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
                    loginTab === t.key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-4">
            {loginTab === "email" ? (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ) : (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                required
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={() => setMode("recovery")} className="text-sm text-primary hover:underline">
                Не помню пароль
              </button>
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-lg py-3 h-auto text-sm font-semibold">
              Войти
            </Button>
          </form>

          {socialSection}

          <p className="text-center text-sm text-muted-foreground mt-4">
            Нет аккаунта?{" "}
            <button type="button" onClick={() => setMode("register")} className="text-primary font-medium hover:underline">
              Зарегистрироваться
            </button>
          </p>
        </div>
      )}

      {mode === "register" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Регистрация</h1>
          <div className="bg-primary/10 text-primary text-sm rounded-lg p-3 mb-6 text-center font-medium">
            Получите приветственную скидку 10% после регистрации!
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {phoneAuthEnabled ? (
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            ) : null}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Пароль"
                required
                minLength={8}
                className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {password && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i <= strength ? strengthColor : "bg-border"}`} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Надёжность: {strengthLabel}</p>
              </div>
            )}

            <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-lg py-3 h-auto text-sm font-semibold">
              Зарегистрироваться
            </Button>
          </form>

          {socialSection}

          <p className="text-center text-sm text-muted-foreground mt-4">
            Уже есть аккаунт?{" "}
            <button type="button" onClick={() => setMode("login")} className="text-primary font-medium hover:underline">
              Войти
            </button>
          </p>
        </div>
      )}

      {mode === "recovery" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">Восстановление</h1>
          {phoneAuthEnabled ? (
            <>
              <p className="text-sm text-muted-foreground mb-6 text-center">Введите номер телефона, привязанный к аккаунту</p>

              <form onSubmit={handleRecovery} className="space-y-4">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>

                <Button type="submit" className="w-full gradient-primary text-primary-foreground rounded-lg py-3 h-auto text-sm font-semibold">
                  Далее
                </Button>

                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="w-full py-3 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
                >
                  Назад
                </button>
              </form>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Восстановление доступа по SMS станет доступно после подключения и активации интеграции SMS (IQSMS) в CRM → Интеграции.
            </p>
          )}

          <div className="mt-6 text-center flex flex-col gap-2">
            <button type="button" onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
              Назад ко входу
            </button>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary hover:underline">
              Связаться с поддержкой
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
