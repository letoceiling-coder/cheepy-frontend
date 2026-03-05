import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Shield, Loader2 } from "lucide-react";
import { settingsApi } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => settingsApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (settings: Record<string, unknown>) => settingsApi.update(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Настройки сохранены");
    },
    onError: () => toast.error("Ошибка сохранения"),
  });

  const settings = data?.data ?? {};
  const flat: Record<string, { value: string | number | boolean | null; type: string; label?: string; group: string }> = {};
  for (const [group, vals] of Object.entries(settings)) {
    if (vals && typeof vals === "object") {
      for (const [k, v] of Object.entries(vals)) {
        const s = v as { value?: string | number | boolean | null; type?: string; label?: string };
        flat[`${group}.${k}`] = { value: s?.value ?? null, type: s?.type ?? "string", label: s?.label ?? undefined, group };
      }
    }
  }

  const [local, setLocal] = useState<Record<string, string | number | boolean>>({});
  useEffect(() => {
    if (!data) return;
    const obj: Record<string, string | number | boolean> = {};
    for (const [key, s] of Object.entries(flat)) {
      if (s.value !== null && s.value !== undefined) obj[key] = s.value as string | number | boolean;
    }
    setLocal(obj);
  }, [data]);

  const setValue = (key: string, val: string | number | boolean) => {
    setLocal((p) => ({ ...p, [key]: val }));
  };

  const handleSave = () => {
    const toSend: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(local)) {
      const [group, k] = key.split(".");
      if (!toSend[group]) toSend[group] = {};
      (toSend[group] as Record<string, unknown>)[k] = val;
    }
    updateMutation.mutate(toSend);
  };

  const groups = [...new Set(Object.keys(flat).map((k) => flat[k].group))];
  const hasChanges = Object.keys(local).length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Настройки</h2>
        {hasChanges && (
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Сохранить
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8"><Loader2 className="h-5 w-5 animate-spin" />Загрузка...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-muted-foreground text-center">
                Нет настроек или API не возвращает данные. Настройки загружаются с парсера.
              </CardContent>
            </Card>
          ) : (
            groups.map((group) => {
              const entries = Object.entries(flat).filter(([, s]) => s.group === group);
              return (
                <Card key={group}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {group === "general" ? <Settings className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                      {group === "general" ? "Общие" : group === "security" ? "Безопасность" : group}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {entries.map(([key, s]) => (
                      <div key={key}>
                        <Label>{s.label ?? key}</Label>
                        {s.type === "boolean" ? (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-sm text-muted-foreground" />
                            <Switch
                              checked={!!(local[key] ?? s.value)}
                              onCheckedChange={(v) => setValue(key, v)}
                            />
                          </div>
                        ) : (
                          <Input
                            type={s.type === "number" ? "number" : "text"}
                            value={String(local[key] ?? s.value ?? "")}
                            onChange={(e) =>
                              setValue(key, s.type === "number" ? Number(e.target.value) : e.target.value)
                            }
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
