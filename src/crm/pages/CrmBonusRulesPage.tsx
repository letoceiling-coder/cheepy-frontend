import { useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { crmBonusRulesApi, type CrmBonusRuleItem } from "@/lib/api";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function CrmBonusRulesPage() {
  const [items, setItems] = useState<CrmBonusRuleItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    crmBonusRulesApi.list()
      .then((r) => {
        setItems(r.data);
        setDrafts(Object.fromEntries(r.data.map((x) => [x.key, JSON.stringify(x.config ?? {}, null, 2)])));
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить бонусные правила"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const save = async (rule: CrmBonusRuleItem, patch: Partial<CrmBonusRuleItem> = {}) => {
    try {
      const config = patch.config ?? JSON.parse(drafts[rule.key] || "{}");
      await crmBonusRulesApi.update(rule.key, {
        is_active: patch.is_active ?? rule.is_active,
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
      <PageHeader title="Бонусная система" description="Правила начисления бонусных рублей: 1 бонус = 1 RUB" />

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка правил…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((rule) => (
            <div key={rule.key} className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{rule.title}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{rule.key}</p>
                </div>
                <Switch checked={rule.is_active} onCheckedChange={(on) => void save(rule, { is_active: on })} />
              </div>
              <Textarea
                value={drafts[rule.key] ?? "{}"}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [rule.key]: e.target.value }))}
                className="min-h-[160px] font-mono text-xs"
              />
              <Button size="sm" className="gap-1.5" onClick={() => void save(rule)}>
                <Save className="h-3.5 w-3.5" /> Сохранить
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
