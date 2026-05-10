import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { crmMarketingNewsApi, resolveCrmMediaAssetUrl, type CrmMarketingNewsItem } from "@/lib/api";
import { Loader2, Newspaper, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CrmMediaPickerDialog } from "@/crm/components/CrmMediaPickerDialog";

const emptyForm = (): Partial<CrmMarketingNewsItem> => ({
  title: "",
  body: "",
  slug: "",
  image_url: "",
  video_url: "",
  file_url: "",
  file_label: "",
  is_active: true,
  sort_order: 0,
  published_at: "",
});

export default function CrmMarketingNewsPage() {
  const [rows, setRows] = useState<CrmMarketingNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<CrmMarketingNewsItem>>(emptyForm);
  const [saving, setSaving] = useState(false);
  /** Попап медиабиблиотеки: фото или видео для новости */
  const [mediaPick, setMediaPick] = useState<"image" | "video" | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    crmMarketingNewsApi
      .list()
      .then((r) => setRows(r.data))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Не удалось загрузить новости"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (n: CrmMarketingNewsItem) => {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body,
      slug: n.slug,
      image_url: n.image_url ?? "",
      video_url: n.video_url ?? "",
      file_url: n.file_url ?? "",
      file_label: n.file_label ?? "",
      is_active: n.is_active,
      sort_order: n.sort_order ?? 0,
      published_at: n.published_at ? n.published_at.slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const title = String(form.title ?? "").trim();
    const body = String(form.body ?? "").trim();
    if (!title || !body) {
      toast.error("Укажите тему и текст");
      return;
    }
    setSaving(true);
    try {
      const pub = form.published_at ? new Date(form.published_at).toISOString() : null;
      const slug = String(form.slug ?? "").trim();
      const payload = {
        title,
        body,
        slug: slug || undefined,
        image_url: String(form.image_url ?? "").trim() || null,
        video_url: String(form.video_url ?? "").trim() || null,
        file_url: String(form.file_url ?? "").trim() || null,
        file_label: String(form.file_label ?? "").trim() || null,
        is_active: !!form.is_active,
        sort_order: Number(form.sort_order ?? 0) || 0,
        published_at: pub,
      };
      if (editingId == null) {
        await crmMarketingNewsApi.create(payload);
        toast.success("Новость создана");
      } else {
        await crmMarketingNewsApi.update(editingId, payload);
        toast.success("Новость обновлена");
      }
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (n: CrmMarketingNewsItem) => {
    if (!window.confirm(`Удалить «${n.title}»?`)) return;
    try {
      await crmMarketingNewsApi.destroy(n.id);
      toast.success("Удалено");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось удалить");
    }
  };

  const columns: Column<CrmMarketingNewsItem>[] = [
    {
      key: "title",
      title: "Тема",
      render: (n) => <span className="font-medium text-sm line-clamp-2">{n.title}</span>,
    },
    {
      key: "is_active",
      title: "Статус",
      render: (n) => <StatusBadge status={n.is_active ? "active" : "inactive"} />,
      className: "w-[100px]",
    },
    {
      key: "published_at",
      title: "Дата публикации",
      render: (n) =>
        n.published_at ? <span className="text-xs font-mono">{new Date(n.published_at).toLocaleString("ru-RU")}</span> : "—",
      className: "hidden lg:table-cell",
    },
    {
      key: "actions",
      title: "",
      render: (n) => (
        <div className="flex justify-end gap-1">
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => openEdit(n)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-destructive" onClick={() => void destroy(n)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      className: "w-[88px]",
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Новости"
        description="Материалы для блока новостей в маркетинговых письмах и на витрине (текст, ссылки на изображение, видео, файл)."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" /> Новая новость
          </Button>
        }
      />

      {loading ? (
        <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Загрузка…
        </div>
      ) : (
        <DataTable data={rows} columns={columns} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" /> {editingId == null ? "Новая новость" : "Редактирование"}
            </DialogTitle>
            <DialogDescription>В письма попадают активные записи с датой публикации не позже текущего момента.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Тема</Label>
              <Input className="h-8 text-sm mt-1" value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Текст (HTML допускается)</Label>
              <Textarea className="mt-1 text-sm min-h-[120px]" value={form.body ?? ""} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Slug (URL)</Label>
                <Input className="h-8 text-sm mt-1 font-mono" value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="авто" />
              </div>
              <div>
                <Label className="text-xs">Сортировка</Label>
                <Input
                  type="number"
                  className="h-8 text-sm mt-1"
                  value={String(form.sort_order ?? 0)}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Изображение</Label>
              <div className="flex gap-2 mt-1 flex-wrap items-stretch">
                <div className="flex-1 min-w-0 rounded-md border border-input bg-muted/30 px-3 py-1.5 text-sm flex items-center min-h-8 truncate" title={form.image_url ?? ""}>
                  {form.image_url ? (
                    <span className="truncate">{resolveCrmMediaAssetUrl(form.image_url)}</span>
                  ) : (
                    <span className="text-muted-foreground">Не выбрано — только из медиабиблиотеки</span>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1" onClick={() => setMediaPick("image")}>
                  Выбрать
                </Button>
                {form.image_url ? (
                  <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setForm({ ...form, image_url: "" })}>
                    Очистить
                  </Button>
                ) : null}
              </div>
            </div>
            <div>
              <Label className="text-xs">Видео</Label>
              <div className="flex gap-2 mt-1 flex-wrap items-stretch">
                <div className="flex-1 min-w-0 rounded-md border border-input bg-muted/30 px-3 py-1.5 text-sm flex items-center min-h-8 truncate" title={form.video_url ?? ""}>
                  {form.video_url ? (
                    <span className="truncate">{resolveCrmMediaAssetUrl(form.video_url)}</span>
                  ) : (
                    <span className="text-muted-foreground">Не выбрано — файл видео из медиабиблиотеки</span>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1" onClick={() => setMediaPick("video")}>
                  Выбрать
                </Button>
                {form.video_url ? (
                  <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={() => setForm({ ...form, video_url: "" })}>
                    Очистить
                  </Button>
                ) : null}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Внешние ссылки (YouTube и т.д.) не задаются здесь — загрузите MP4/WebM в библиотеку или вставьте ссылку в текст HTML.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Файл (URL)</Label>
                <Input className="h-8 text-sm mt-1" value={form.file_url ?? ""} onChange={(e) => setForm({ ...form, file_url: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Подпись к файлу</Label>
                <Input className="h-8 text-sm mt-1" value={form.file_label ?? ""} onChange={(e) => setForm({ ...form, file_label: e.target.value })} placeholder="PDF, прайс" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Дата публикации (локально)</Label>
              <Input
                type="datetime-local"
                className="h-8 text-sm mt-1"
                value={form.published_at ?? ""}
                onChange={(e) => setForm({ ...form, published_at: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={!!form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} id="nw-active" />
              <Label htmlFor="nw-active" className="text-sm cursor-pointer">
                Активна для рассылок
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button size="sm" disabled={saving} onClick={() => void save()}>
                {saving ? "Сохранение…" : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CrmMediaPickerDialog
        key={mediaPick ?? "closed"}
        open={mediaPick !== null}
        accept={mediaPick ?? undefined}
        onOpenChange={(v) => {
          if (!v) setMediaPick(null);
        }}
        onPick={(file) => {
          const raw = resolveCrmMediaAssetUrl(file.url).trim();
          if (!raw) {
            toast.error("У выбранного файла нет URL");
            return;
          }
          const target = mediaPick;
          if (target === "image") setForm((prev) => ({ ...prev, image_url: raw }));
          else if (target === "video") setForm((prev) => ({ ...prev, video_url: raw }));
          setMediaPick(null);
        }}
      />
    </div>
  );
}
