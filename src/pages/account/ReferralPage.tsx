import { Users, Copy, Check, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import { storeAccountApi } from "@/lib/api";
import { toast } from "sonner";

const ReferralPage = () => {
  const [copied, setCopied] = useState(false);
  const [referral, setReferral] = useState<{
    code: string;
    link: string;
    referrer_reward_rub?: number;
    stats: { clicks: number; registrations: number; rewarded_amount: number };
  } | null>(null);

  useEffect(() => {
    storeAccountApi.referral()
      .then(setReferral)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить реферальные данные"));
  }, []);

  const rewardRub =
    referral?.referrer_reward_rub !== undefined &&
    referral.referrer_reward_rub !== null &&
    Number.isFinite(referral.referrer_reward_rub)
      ? Math.max(0, Math.round(Number(referral.referrer_reward_rub)))
      : 500;

  const copyCode = () => {
    if (!referral) return;
    navigator.clipboard.writeText(referral.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-4">Реферальная программа</h2>

      <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6 text-sm text-muted-foreground leading-relaxed">
        Друзья могут перейти по ссылке с параметром <span className="font-mono text-foreground">?ref=ВАШ_КОД</span>: мы зафиксируем переход,
        затем код подставится при регистрации или автоматически привяжется к уже созданному аккаунту при входе по ссылке.
      </div>

      <div className="gradient-primary rounded-2xl p-6 text-primary-foreground mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Gift className="w-8 h-8" />
          <div>
            <p className="font-bold text-lg">Приглашайте друзей</p>
            <p className="text-sm opacity-80">
              До {rewardRub.toLocaleString("ru-RU")} ₽ бонусами за друга после его первой оплаченной покупки
            </p>
          </div>
        </div>

        <div className="bg-background/20 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
          <span className="font-mono text-lg font-bold">{referral?.code ?? "—"}</span>
          <button onClick={copyCode} className="flex items-center gap-1 bg-background text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            {copied ? <><Check className="w-4 h-4" />Скопировано</> : <><Copy className="w-4 h-4" />Копировать</>}
          </button>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3">Как это работает</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Дайте ссылку или код",
            desc: "Ссылка уже содержит код; переход засчитывается, даже если друг пока только смотрит каталог.",
          },
          {
            step: "2",
            title: "Друг становится вашим приглашённым",
            desc: "Код сохранится в браузере и подставится при регистрации или привяжется после входа, если аккаунт недавний.",
          },
          {
            step: "3",
            title: "Бонус на счёт",
            desc: `${rewardRub.toLocaleString("ru-RU")} ₽ начислятся после первой оплаченной покупки друга (по правилам акции в CRM).`,
          },
        ].map(s => (
          <div key={s.step} className="p-4 rounded-xl border border-border text-center">
            <div className="w-10 h-10 rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-lg font-bold mx-auto mb-3">{s.step}</div>
            <p className="font-semibold text-foreground text-sm mb-1">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">Переходов: {referral?.stats.clicks ?? 0}</p>
            <p className="text-xs text-muted-foreground">Регистраций: {referral?.stats.registrations ?? 0} · Заработано: {(referral?.stats.rewarded_amount ?? 0).toLocaleString()} ₽</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
