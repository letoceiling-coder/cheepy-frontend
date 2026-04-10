import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { adminCmsApi, ApiError, type CmsPageListItem } from "@/lib/api";
import { Plus } from "lucide-react";

function suggestSlug(title: string): string {
  const t = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
  return t || "page";
}

export default function CrmCmsPagesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CmsPageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminCmsApi
      .list({ per_page: 100 })
      .then((r) => setRows(r.data || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!slugTouched && title.trim()) {
      setSlug(suggestSlug(title));
    }
  }, [title, slugTouched]);

  const handleCreate = async () => {
    const t = title.trim();
    const s = slug.trim();
    if (!t || !s) {
      setError("Укажите название и slug");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const page = await adminCmsApi.create({ title: t, slug: s, path_prefix: "p" });
      setOpen(false);
      setTitle("");
      setSlug("");
      setSlugTouched(false);
      load();
      navigate(`/crm/cms/pages/${page.id}`);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Не удалось создать страницу";
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const columns: Column<CmsPageListItem>[] = [
    { key: "title", title: "Название", render: (r) => <span className="font-medium text-sm">{r.title}</span> },
    {
      key: "url",
      title: "URL",
      render: (r) => (
        <span className="text-xs text-muted-foreground font-mono">
          /{r.path_prefix}/{r.slug}
        </span>
      ),
    },
    { key: "status", title: "Статус", render: (r) => <StatusBadge status={r.status === "published" ? "published" : "draft"} /> },
    { key: "updated_at", title: "Обновлено", render: (r) => <span className="text-xs text-muted-foreground">{r.updated_at?.slice(0, 10) ?? "—"}</span> },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="CMS-страницы"
        description="Лендинги и произвольные страницы конструктора, публикация на сайте"
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Новая страница
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Новая CMS-страница</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cms-title">Название</Label>
                  <Input
                    id="cms-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="О нас"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cms-slug">Slug (URL)</Label>
                  <Input
                    id="cms-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(e.target.value);
                    }}
                    placeholder="about-us"
                    className="font-mono text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground">Публичный путь: /p/{slug || "…"}</p>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} type="button">
                  Отмена
                </Button>
                <Button onClick={handleCreate} disabled={creating} type="button">
                  {creating ? "Создание…" : "Создать"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      ) : (
        <DataTable data={rows} columns={columns} onRowClick={(r) => navigate(`/crm/cms/pages/${r.id}`)} />
      )}
    </div>
  );
}
