import { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User, ShoppingBag, MapPin, Truck, Heart } from "lucide-react";

interface LoginPromptContextType {
  requireAuth: (action?: string) => boolean;
}

const LoginPromptContext = createContext<LoginPromptContextType | undefined>(undefined);

export const useLoginPrompt = () => {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) throw new Error("useLoginPrompt must be used within LoginPromptProvider");
  return ctx;
};

export const LoginPromptProvider = ({ children, isAuthenticated }: { children: ReactNode; isAuthenticated: boolean }) => {
  const [open, setOpen] = useState(false);
  const [actionLabel, setActionLabel] = useState("");

  const requireAuth = (action?: string): boolean => {
    if (isAuthenticated) return true;
    setActionLabel(action || "");
    setOpen(true);
    return false;
  };

  return (
    <LoginPromptContext.Provider value={{ requireAuth }}>
      {children}
      <LoginPromptModal open={open} onOpenChange={setOpen} actionLabel={actionLabel} />
    </LoginPromptContext.Provider>
  );
};

const benefits = [
  { icon: ShoppingBag, text: "Просматривать заказы" },
  { icon: MapPin, text: "Управлять адресами" },
  { icon: Truck, text: "Отслеживать доставки" },
  { icon: Heart, text: "Сохранять избранные товары" },
];

const LoginPromptModal = ({ open, onOpenChange, actionLabel }: { open: boolean; onOpenChange: (v: boolean) => void; actionLabel: string }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-border">
        <div className="p-6 md:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-1">Требуется авторизация</h2>
          {actionLabel && (
            <p className="text-sm text-muted-foreground mb-4">
              Для действия «{actionLabel}» необходимо войти в аккаунт
            </p>
          )}
          {!actionLabel && (
            <p className="text-sm text-muted-foreground mb-4">Войдите, чтобы управлять аккаунтом</p>
          )}
          <div className="space-y-2 mb-6 text-left">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
                <b.icon size={14} className="text-primary shrink-0" />
                <span className="text-sm text-foreground">{b.text}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => { onOpenChange(false); navigate("/auth"); }}
              className="h-11 w-full gradient-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all duration-200"
            >
              Войти
            </button>
            <button
              onClick={() => { onOpenChange(false); navigate("/auth"); }}
              className="h-11 w-full rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-all duration-200"
            >
              Создать аккаунт
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
