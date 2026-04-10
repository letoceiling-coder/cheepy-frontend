import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, Lock, User as UserIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const VkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.12-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
  </svg>
);
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);
const YandexIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#FC3F1D">
    <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm11.3 6.7V7.8h-1.06c-1.88 0-2.88 1.02-2.88 2.46 0 1.6.66 2.36 2.02 3.28l1.12.76-3.26 4.4h-2.1l2.94-3.94c-1.64-1.14-2.56-2.2-2.56-4.02 0-2.34 1.62-3.94 4.72-3.94H15V18.7h-1.7z" />
  </svg>
);
const OkIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#EE8208">
    <path d="M14.505 17.44a11.599 11.599 0 0 0 3.6-1.49.932.932 0 0 0 .308-1.282.932.932 0 0 0-1.282-.308 9.753 9.753 0 0 1-10.262 0 .932.932 0 0 0-1.282.308.932.932 0 0 0 .308 1.282c1.092.678 2.294 1.17 3.6 1.49l-3.455 3.456a.932.932 0 0 0 0 1.32.932.932 0 0 0 1.32 0L12 18.058l4.638 4.638a.932.932 0 0 0 1.32 0 .932.932 0 0 0 0-1.32l-3.453-3.936zM12 12.29a5.145 5.145 0 1 0 0-10.29 5.145 5.145 0 0 0 0 10.29zm0-8.398a3.253 3.253 0 1 1 0 6.506 3.253 3.253 0 0 1 0-6.506z" />
  </svg>
);

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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(loginTab === "email" ? email : phone, password);
    navigate("/");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    register(name, email, phone, password);
    navigate("/");
  };

  const handleRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setMode("login");
  };

  const socialButtons = (
    <div className="space-y-3">
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-border flex-1" />
        <span className="px-3 text-sm text-muted-foreground">или</span>
        <div className="border-t border-border flex-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: VkIcon, label: "VK", bg: "bg-[#0077FF]", text: "text-white" },
          { icon: GoogleIcon, label: "Google", bg: "bg-background border border-border", text: "text-foreground" },
          { icon: YandexIcon, label: "Яндекс", bg: "bg-background border border-border", text: "text-foreground" },
          { icon: OkIcon, label: "OK", bg: "bg-background border border-border", text: "text-foreground" },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 ${s.bg} ${s.text}`}
          >
            <s.icon />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-[440px] mx-auto w-full">
      {mode === "login" && (
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Вход</h1>

          <div className="flex rounded-lg bg-secondary p-1 mb-6">
            {[
              { key: "email" as LoginTab, icon: Mail, label: "Email" },
              { key: "phone" as LoginTab, icon: Phone, label: "Телефон" },
            ].map((t) => (
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

          {socialButtons}

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
            🎁 Получите приветственную скидку 10% после регистрации!
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

          {socialButtons}

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

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-primary hover:underline">
              Связаться с поддержкой
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
