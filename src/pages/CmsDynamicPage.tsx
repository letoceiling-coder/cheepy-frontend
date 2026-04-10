import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { BlockRenderer } from "@/constructor/blockRenderer";
import type { BlockConfig } from "@/constructor/types";
import { publicCmsApi, type CmsPagePublicResponse, ApiError } from "@/lib/api";
import { Loader2 } from "lucide-react";

const DEFAULT_SITE_TITLE = "Cheepy — маркетплейс модной одежды";
const DEFAULT_SITE_DESCRIPTION = "Маркетплейс модной одежды и аксессуаров";

/** Должен совпадать с path_prefix страницы в CMS и сегментом URL `/p/...` */
function cmsPathPrefix(): string {
  const v = String(import.meta.env.VITE_CMS_PATH_PREFIX || "p").trim().toLowerCase();
  return v || "p";
}

function applySeo(page: CmsPagePublicResponse["page"]) {
  const seo = page.seo;
  const title = seo.title || seo.og_title || page.title || DEFAULT_SITE_TITLE;
  document.title = title;

  const desc = seo.description || seo.og_description || DEFAULT_SITE_DESCRIPTION;
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement("meta");
    metaDesc.setAttribute("name", "description");
    document.head.appendChild(metaDesc);
  }
  metaDesc.setAttribute("content", desc);

  const robots = seo.robots?.trim();
  if (robots) {
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.setAttribute("name", "robots");
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute("content", robots);
  }

  const setOg = (prop: string, content: string | null | undefined) => {
    if (!content) return;
    let el = document.querySelector(`meta[property="${prop}"]`);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", prop);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  };
  setOg("og:title", seo.og_title || seo.title || page.title);
  setOg("og:description", seo.og_description || seo.description);
  if (seo.og_image_url) setOg("og:image", seo.og_image_url);

  const canonical = seo.canonical_url?.trim();
  if (canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }
}

/**
 * Публичная страница из CMS: GET /api/v1/public/cms/pages/{pathPrefix}/{slug}
 * URL на витрине: /p/:slug (префикс задаётся VITE_CMS_PATH_PREFIX, по умолчанию p).
 */
export default function CmsDynamicPage() {
  const { slug } = useParams<{ slug: string }>();
  const pathPrefix = cmsPathPrefix();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["public-cms-page", pathPrefix, slug],
    queryFn: () => publicCmsApi.getPage(pathPrefix, slug!),
    enabled: Boolean(slug),
    retry: false,
  });

  useEffect(() => {
    if (!data?.page) return;
    const prevTitle = document.title;
    const metaDescEl = document.querySelector('meta[name="description"]');
    const prevDesc = metaDescEl?.getAttribute("content") || DEFAULT_SITE_DESCRIPTION;
    const robotsEl = document.querySelector('meta[name="robots"]');
    const hadRobotsBefore = !!robotsEl;
    const prevRobots = robotsEl?.getAttribute("content") || "";

    applySeo(data.page);
    return () => {
      document.title = prevTitle;
      const m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute("content", prevDesc);
      const r = document.querySelector('meta[name="robots"]');
      if (hadRobotsBefore) {
        if (r) r.setAttribute("content", prevRobots);
      } else {
        r?.remove();
      }
    };
  }, [data]);

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground">Некорректный адрес</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="min-h-screen bg-background flex flex-col pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">{notFound ? "Страница не найдена" : "Не удалось загрузить страницу"}</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {notFound
              ? "Такой CMS-страницы нет или она скрыта."
              : error instanceof Error
                ? error.message
                : "Проверьте соединение и настройки API."}
          </p>
          <Link to="/" className="text-sm text-primary hover:underline">
            На главную
          </Link>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const blocks = [...data.blocks]
    .filter((b) => b.is_visible)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="min-h-screen bg-background pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <Header />
      <main className="cms-dynamic-page">
        <div className="max-w-[1400px] mx-auto px-4 py-4 space-y-2">
          {blocks.map((b, idx) => {
            const cfg: BlockConfig = {
              id: b.client_key || `cms-${data.page.id}-${idx}`,
              type: b.block_type,
              label: b.block_type,
              category: "hero",
              settings: (b.settings && typeof b.settings === "object" ? b.settings : {}) as BlockConfig["settings"],
            };
            return (
              <div key={cfg.id} className="cms-block" data-block-type={b.block_type}>
                <BlockRenderer block={cfg} />
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
