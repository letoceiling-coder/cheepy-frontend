import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "../components/StatusBadge";
import { adminCmsApi, ApiError, type CmsPageDetail } from "@/lib/api";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { toast } from "sonner";

export default function CrmCmsPageDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : null;

  const [page, setPage] = useState<CmsPageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [robots, setRobots] = useState("");

  const load = useCallback(async () => {
    if (id === null) return;
    setLoading(true);
    try {
      const p = await adminCmsApi.get(id);
      setPage(p);
      setSeoTitle(p.seo.title ?? "");
      setSeoDescription(p.seo.description ?? "");
      setOgTitle(p.seo.og_title ?? "");
      setOgDescription(p.seo.og_description ?? "");
      setOgImageUrl(p.seo.og_image_url ?? "");
      setCanonicalUrl(p.seo.canonical_url ?? "");
      setRobots(p.seo.robots ?? "");
    } catch {
      setPage(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const latestVersionId = useMemo(() => {
    if (!page?.versions?.length) return null;
    return page.versions[0].id;
  }, [page]);

  const constructorHref =
    id !== null && latestVersionId !== null
      ? `/constructor?cmsPageId=${id}&cmsVersionId=${latestVersionId}`
      : null;

  const previewHref = page ? `/${page.path_prefix}/${page.slug}` : null;

  const handleSaveSeo = async () => {
    if (id === null) return;
    setSaving(true);
    try {
      const updated = await adminCmsApi.update(id, {
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        og_title: ogTitle.trim() || null,
        og_description: ogDescription.trim() || null,
        og_image_url: ogImageUrl.trim() || null,
        canonical_url: canonicalUrl.trim() || null,
        robots: robots.trim() || null,
      });
      setPage(updated);
      toast.success("SEO сохранено");
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Ошибка сохранения";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (id === null) return;
    setPublishing(true);
    try {
      const updated = await adminCmsApi.publish(id);
      setPage(updated);
      toast.success("Страница опубликована");
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : "Не удалось опубликовать";
      toast.error(msg);
    } finally {
      setPublishing(false);
    }
  };

  if (id === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Некорректный ID</h2>
          <Link to="/crm/cms/pages" className="text-sm text-primary hover:underline">
            ← К списку страниц
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground p-6">Загрузка…</p>;
  }

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Страница не найдена</h2>
          <Link to="/crm/cms/pages" className="text-sm text-primary hover:underline">
            ← К списку страниц
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/crm/cms/pages">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={page.title}
          description={`/${page.path_prefix}/${page.slug} · v${page.versions[0]?.version_number ?? "—"}`}
          actions={<StatusBadge status={page.status === "published" ? "active" : "draft"} />}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {constructorHref && (
          <Button asChild size="sm" className="gap-1.5">
            <Link to={constructorHref}>
              <Pencil className="h-3.5 w-3.5" />
              Редактировать в конструкторе
            </Link>
          </Button>
        )}
        {previewHref && (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={previewHref} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
              Предпросмотр на сайте
            </a>
          </Button>
        )}
        <Button size="sm" variant="secondary" onClick={handlePublish} disabled={publishing || !latestVersionId}>
          {publishing ? "Публикация…" : "Опубликовать текущую версию"}
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">SEO</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="seo-title">Title</Label>
            <Input id="seo-title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seo-desc">Description</Label>
            <Textarea id="seo-desc" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="og-title">OG title</Label>
            <Input id="og-title" value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="og-desc">OG description</Label>
            <Textarea id="og-desc" value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="og-img">OG image URL</Label>
            <Input id="og-img" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="canonical">Canonical URL</Label>
            <Input id="canonical" value={canonicalUrl} onChange={(e) => setCanonicalUrl(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="robots">Robots</Label>
            <Input id="robots" value={robots} onChange={(e) => setRobots(e.target.value)} placeholder="index,follow" />
          </div>
        </div>
        <Button size="sm" onClick={handleSaveSeo} disabled={saving}>
          {saving ? "Сохранение…" : "Сохранить SEO"}
        </Button>
      </div>

      {page.versions.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Версии</h3>
          <ul className="text-sm space-y-2">
            {page.versions.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2">
                <span>
                  Версия {v.version_number}{" "}
                  <span className="text-muted-foreground">({v.status})</span>
                  {page.published_version_id === v.id && (
                    <span className="ml-2 text-xs text-primary">опубликована</span>
                  )}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/constructor?cmsPageId=${page.id}&cmsVersionId=${v.id}`}>Открыть</Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
