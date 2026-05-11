import { useEffect, useState, type ReactNode } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crmBonusRulesApi, type CrmBonusRuleItem } from "@/lib/api";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULTS = {
  purchase_bonus: {
    eligible_share_percent: 30,
    min_product_amount: 1000,
    bonus_percent: 5,
    random_launch_months: 2,
    disable_accrual_when_bonus_spent: true,
  },
  review_bonus: {
    amount: 25,
    min_product_amount: 500,
    requires_purchase: true,
  },
  mini_game_bonus: {
    requires_validated_prize_event: true,
  },
  seller_bonus: {
    enabled_for_seller_campaigns: false,
  },
  referral_reward: {
    referrer_reward_rub: 500,
  },
} as const;

type KnownKey = keyof typeof DEFAULTS;

function isKnownRuleKey(key: string): key is KnownKey {
  return key in DEFAULTS;
}

function num(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (v === true || v === "true") return true;
  if (v === false || v === "false") return false;
  return fallback;
}

function mergePurchase(cfg: Record<string, unknown>): (typeof DEFAULTS)["purchase_bonus"] {
  const d = DEFAULTS.purchase_bonus;
  return {
    eligible_share_percent: num(cfg.eligible_share_percent, d.eligible_share_percent),
    min_product_amount: Math.max(0, Math.round(num(cfg.min_product_amount, d.min_product_amount))),
    bonus_percent: num(cfg.bonus_percent, d.bonus_percent),
    random_launch_months: Math.max(
      0,
      Math.round(num(cfg.random_launch_months, d.random_launch_months))
    ),
    disable_accrual_when_bonus_spent: bool(cfg.disable_accrual_when_bonus_spent, d.disable_accrual_when_bonus_spent),
  };
}

function mergeReview(cfg: Record<string, unknown>): (typeof DEFAULTS)["review_bonus"] {
  const d = DEFAULTS.review_bonus;
  return {
    amount: Math.max(0, Math.round(num(cfg.amount, d.amount))),
    min_product_amount: Math.max(0, Math.round(num(cfg.min_product_amount, d.min_product_amount))),
    requires_purchase: bool(cfg.requires_purchase, d.requires_purchase),
  };
}

function mergeMiniGame(cfg: Record<string, unknown>): (typeof DEFAULTS)["mini_game_bonus"] {
  const d = DEFAULTS.mini_game_bonus;
  return {
    requires_validated_prize_event: bool(cfg.requires_validated_prize_event, d.requires_validated_prize_event),
  };
}

function mergeSeller(cfg: Record<string, unknown>): (typeof DEFAULTS)["seller_bonus"] {
  const d = DEFAULTS.seller_bonus;
  return {
    enabled_for_seller_campaigns: bool(cfg.enabled_for_seller_campaigns, d.enabled_for_seller_campaigns),
  };
}

function mergeReferralReward(cfg: Record<string, unknown>): (typeof DEFAULTS)["referral_reward"] {
  const d = DEFAULTS.referral_reward;
  return {
    referrer_reward_rub: Math.max(0, Math.round(num(cfg.referrer_reward_rub, d.referrer_reward_rub))),
  };
}

function normalizeConfig(key: KnownKey, raw: Record<string, unknown>): Record<string, unknown> {
  switch (key) {
    case "purchase_bonus":
      return mergePurchase(raw);
    case "review_bonus":
      return mergeReview(raw);
    case "mini_game_bonus":
      return mergeMiniGame(raw);
    case "seller_bonus":
      return mergeSeller(raw);
    case "referral_reward":
      return mergeReferralReward(raw);
    default: {
      const _never: never = key;
      return _never;
    }
  }
}

function Hint({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-xs text-muted-foreground", className)}>{children}</p>;
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
      <div className="space-y-0.5 min-w-0">
        <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
          {label}
        </Label>
        {hint ? <Hint>{hint}</Hint> : null}
      </div>
      <Switch id={id} className="shrink-0" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  suffix,
  integerOnly,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number | string;
  suffix?: string;
  /** Если true — при blur округляется до целого (суммы, месяцы, доли без копеек). */
  integerOnly?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      {hint ? <Hint className="-mt-0.5">{hint}</Hint> : null}
      <div className="relative max-w-[12rem]">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          className={cn(suffix ? "pr-12" : undefined)}
          min={min}
          max={max}
          step={step ?? 1}
          value={Number.isFinite(value) ? String(value) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (raw === "" || raw === "-") return;
            onChange(Number(raw));
          }}
          onBlur={(e) => {
            let n = Number(e.target.value);
            if (!Number.isFinite(n)) n = min ?? 0;
            if (min !== undefined && n < min) n = min;
            if (max !== undefined && n > max) n = max;
            if (integerOnly) onChange(Math.round(n));
            else onChange(Math.round(n * 100) / 100);
          }}
        />
        {suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function KnownRuleFields({
  ruleKey,
  config,
  onChange,
}: {
  ruleKey: KnownKey;
  config: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  if (ruleKey === "purchase_bonus") {
    const c = mergePurchase(config);
    return (
      <div className="space-y-5">
        <NumberField
          id={`${ruleKey}-eligible`}
          label="Доля оплаты деньгами"
          hint="Не меньше этой доли суммы позиций должна быть оплачена наличными/картой, чтобы начисление сработало (процент от суммы строки)."
          suffix="%"
          integerOnly
          min={0}
          max={100}
          value={c.eligible_share_percent}
          onChange={(eligible_share_percent) =>
            onChange(normalizeConfig(ruleKey, { ...c, eligible_share_percent }))
          }
        />
        <NumberField
          id={`${ruleKey}-min-product`}
          label="Минимальная цена товара"
          hint="Позиция корзины учитывается только если цена товара не ниже этого порога (₽)."
          suffix="₽"
          min={0}
          integerOnly
          value={c.min_product_amount}
          onChange={(min_product_amount) =>
            onChange(normalizeConfig(ruleKey, { ...c, min_product_amount }))
          }
        />
        <NumberField
          id={`${ruleKey}-bonus-pct`}
          label="Процент бонусов"
          hint="Доля от подходящей суммы, которая начисляется бонусными рублями (1 бонус = 1 ₽)."
          suffix="%"
          min={0}
          max={100}
          step={0.1}
          value={c.bonus_percent}
          onChange={(bonus_percent) => onChange(normalizeConfig(ruleKey, { ...c, bonus_percent }))}
        />
        <NumberField
          id={`${ruleKey}-months`}
          label="Длительность промо-периода"
          hint="Параметр кампании (месяцев) для ограничения окна случайного старта."
          suffix="мес."
          min={0}
          integerOnly
          value={c.random_launch_months}
          onChange={(random_launch_months) =>
            onChange(normalizeConfig(ruleKey, { ...c, random_launch_months }))
          }
        />
        <ToggleRow
          id={`${ruleKey}-disable-spent`}
          label="Стоп начисления при оплате бонусами"
          hint="Не начислять бонусы за заказ, если в оплате участвуют списанные бонусные рубли."
          checked={c.disable_accrual_when_bonus_spent}
          onCheckedChange={(disable_accrual_when_bonus_spent) =>
            onChange(normalizeConfig(ruleKey, { ...c, disable_accrual_when_bonus_spent }))
          }
        />
      </div>
    );
  }
  if (ruleKey === "review_bonus") {
    const c = mergeReview(config);
    return (
      <div className="space-y-5">
        <NumberField
          id={`${ruleKey}-amount`}
          label="Размер бонуса за отзыв"
          hint="Сколько бонусных рублей начислится за один подходящий отзыв."
          suffix="бон."
          min={0}
          integerOnly
          value={c.amount}
          onChange={(amount) => onChange(normalizeConfig(ruleKey, { ...c, amount }))}
        />
        <NumberField
          id={`${ruleKey}-min`}
          label="Минимальная цена товара"
          hint="Отзыв учитывается только если заказана позиция с ценой не ниже этого значения."
          suffix="₽"
          min={0}
          integerOnly
          value={c.min_product_amount}
          onChange={(min_product_amount) =>
            onChange(normalizeConfig(ruleKey, { ...c, min_product_amount }))
          }
        />
        <ToggleRow
          id={`${ruleKey}-requires`}
          label="Только после покупки"
          hint="Начислять бонус только если есть подтверждённая покупка товара пользователем."
          checked={c.requires_purchase}
          onCheckedChange={(requires_purchase) =>
            onChange(normalizeConfig(ruleKey, { ...c, requires_purchase }))
          }
        />
      </div>
    );
  }
  if (ruleKey === "mini_game_bonus") {
    const c = mergeMiniGame(config);
    return (
      <ToggleRow
        id={`${ruleKey}-validated`}
        label="Только подтверждённый выигрыш"
        hint="Бонус начисляется только при валидированном событии приза из мини-игры."
        checked={c.requires_validated_prize_event}
        onCheckedChange={(requires_validated_prize_event) =>
          onChange(normalizeConfig(ruleKey, { ...c, requires_validated_prize_event }))
        }
      />
    );
  }
  if (ruleKey === "referral_reward") {
    const c = mergeReferralReward(config);
    return (
      <div className="space-y-5">
        <NumberField
          id={`${ruleKey}-referrer`}
          label="Бонус пригласившему"
          hint="Сколько бонусных рублей начислить на счёт реферера после первой оплаченной покупки приглашённого."
          suffix="₽"
          min={0}
          integerOnly
          value={c.referrer_reward_rub}
          onChange={(referrer_reward_rub) =>
            onChange(normalizeConfig(ruleKey, { ...c, referrer_reward_rub }))
          }
        />
      </div>
    );
  }
  const c = mergeSeller(config);
  return (
    <ToggleRow
      id={`${ruleKey}-campaigns`}
      label="Учитывать кампании продавцов"
      hint="Включить или отключить бонусные механики, привязанные к акциям продавцов."
      checked={c.enabled_for_seller_campaigns}
      onCheckedChange={(enabled_for_seller_campaigns) =>
        onChange(normalizeConfig(ruleKey, { ...c, enabled_for_seller_campaigns }))
      }
    />
  );
}

export default function CrmBonusRulesPage() {
  const [items, setItems] = useState<CrmBonusRuleItem[]>([]);
  /** Черновик для правки в форме по ключу правила. */
  const [drafts, setDrafts] = useState<Record<string, Record<string, unknown>>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    crmBonusRulesApi
      .list()
      .then((r) => {
        setItems(r.data);
        const nextDrafts: Record<string, Record<string, unknown>> = {};
        for (const x of r.data) {
          const raw = x.config ?? {};
          let saved: Record<string, unknown>;
          if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
            saved = { ...(raw as Record<string, unknown>) };
          } else {
            saved = {};
          }
          if (isKnownRuleKey(x.key)) {
            nextDrafts[x.key] = normalizeConfig(x.key, saved);
          }
        }
        setDrafts(nextDrafts);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить бонусные правила"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (
    rule: CrmBonusRuleItem,
    opts: Partial<{ is_active: boolean; config: Record<string, unknown> }> = {}
  ) => {
    try {
      const config =
        opts.config ??
        (isKnownRuleKey(rule.key)
          ? normalizeConfig(rule.key, drafts[rule.key] ?? {})
          : ((rule.config ?? {}) as Record<string, unknown>));

      await crmBonusRulesApi.update(rule.key, {
        is_active: opts.is_active ?? rule.is_active,
        config,
      });
      toast.success("Правило сохранено");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить правило");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Бонусная система" description="Правила начисления бонусных рублей: 1 бонус = 1 ₽" />

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка правил…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((rule) => (
            <div key={rule.key} className="rounded-lg border border-border bg-card p-4 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{rule.title}</h3>
                </div>
                <Switch checked={rule.is_active} onCheckedChange={(on) => void save(rule, { is_active: on })} />
              </div>

              {isKnownRuleKey(rule.key) ? (
                <KnownRuleFields
                  ruleKey={rule.key}
                  config={drafts[rule.key] ?? normalizeConfig(rule.key, {})}
                  onChange={(next) => setDrafts((prev) => ({ ...prev, [rule.key]: next }))}
                />
              ) : (
                <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                  Для этого ключа («{rule.key}») пока нет формы настроек. Обратитесь к разработчику или сохраните
                  параметры через API.
                </div>
              )}

              {isKnownRuleKey(rule.key) ? (
                <Button size="sm" className="gap-1.5" onClick={() => void save(rule)}>
                  <Save className="h-3.5 w-3.5" /> Сохранить настройки
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
