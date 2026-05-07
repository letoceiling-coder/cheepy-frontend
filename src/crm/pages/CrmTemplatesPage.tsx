import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { crmEmailTemplatesApi, type CrmEmailTemplateListItem } from "@/lib/api";
import { Eye, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

const Q_TEMPLATES = ["crm-email-templates"] as const;
const mkDetailKey = (id: number | null) => ["crm-email-template", id] as const;

export default function CrmTemplatesPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<{ subject: string; body_html: string } | null>(null);

  const listQuery = useQuery({
    queryKey: Q_TEMPLATES,
    queryFn: () => crmEmailTemplatesApi.list().then((r) => r.data),
  });

  const detailQuery = useQuery({
    queryKey: mkDetailKey(activeId),
    queryFn: () => crmEmailTemplatesApi.get(activeId!).then((r) => r.data),
    enabled: activeId !== null,
  });

  useEffect(() => {
    const rows = listQuery.data;
    if (listQuery.isLoading || rows == null || rows.length === 0) return;
    setActiveId((prev) => (prev == null ? rows[0]!.id : prev));
  }, [listQuery.isLoading, listQuery.data]);

  useEffect(() => {
    const d = detailQuery.data;
    if (!d) return;
    setTitle(d.title);
    setSubject(d.subject);
    setBodyHtml(d.body_html);
    setIsAutomatic(d.is_automatic);
    setIsActive(d.is_active);
  }, [detailQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      crmEmailTemplatesApi.update(activeId!, {
        title,
        subject,
        body_html: bodyHtml,
        is_automatic: isAutomatic,
        is_active: isActive,
      }),
    onSuccess: () => {
      toast.success("Шаблон сохранён");
      qc.invalidateQueries({ queryKey: Q_TEMPLATES });
      qc.invalidateQueries({ queryKey: mkDetailKey(activeId) });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка сохранения"),
  });

  const previewMutation = useMutation({
    mutationFn: () => crmEmailTemplatesApi.preview({ subject, body_html: bodyHtml }),
    onSuccess: (r) => {
      setPreviewHtml({ subject: r.subject, body_html: r.body_html });
      setPreviewOpen(true);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Предпросмотр недоступен"),
  });

  const templates = listQuery.data ?? [];

  const selectTemplate = (t: CrmEmailTemplateListItem) => setActiveId(t.id);

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="Конструктор шаблонов" description="HTML-письма с данными из настроек маркетплейса" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium mb-2">Шаблоны</h3>
          {listQuery.isLoading ? (
            <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Загрузка…</p>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTemplate(t)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  activeId === t.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent/5"
                }`}
              >
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{t.send_trigger}</p>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {activeId === null ? (
            <p className="text-sm text-muted-foreground">Выберите шаблон слева.</p>
          ) : detailQuery.isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : detailQuery.isError ? (
            <p className="text-destructive text-sm">Не удалось загрузить шаблон</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => previewMutation.mutate()} disabled={previewMutation.isPending}>
                  <Eye className="h-3.5 w-3.5" /> Предпросмотр с подстановками
                </Button>
                <Button size="sm" className="gap-1.5" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  <Save className="h-3.5 w-3.5" /> Сохранить
                </Button>
              </div>
              <div className="grid gap-3 max-w-3xl">
                <div><Label className="text-xs">Название</Label><Input className="h-9 mt-1 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label className="text-xs">Тема</Label><Input className="h-9 mt-1 text-sm font-mono" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                <div><Label className="text-xs">HTML</Label><Textarea rows={14} className="mt-1 text-xs font-mono" value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)} /></div>
                {detailQuery.data?.placeholder_hint ? (
                  <p className="text-[11px] text-muted-foreground break-words">{detailQuery.data.placeholder_hint}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="tpl-auto" checked={isAutomatic} onCheckedChange={setIsAutomatic} />
                  <Label htmlFor="tpl-auto" className="text-sm">Автоотправка по событию</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="tpl-act" checked={isActive} onCheckedChange={setIsActive} />
                  <Label htmlFor="tpl-act" className="text-sm">Активен</Label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={(o) => { setPreviewOpen(o); if (!o) setPreviewHtml(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader><DialogTitle>{previewHtml?.subject ?? "Предпросмотр"}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[65vh] border rounded-md bg-card">
            {previewHtml ? <iframe title="preview" className="w-full min-h-[400px] border-0 bg-white" srcDoc={previewHtml.body_html} /> : null}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
