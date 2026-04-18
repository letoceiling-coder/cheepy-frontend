import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  XCircle,
  Save,
  GripVertical,
  ImagePlus,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Play,
  ScanSearch,
} from "lucide-react";
import { PermissionGate } from "../rbac/PermissionGate";
import {
  adminSystemProductsApi,
  adminSiteAlApi,
  adminCatalogApi,
  resolveCrmMediaAssetUrl,
  type CatalogCategoryItem,
  type CrmMediaFile,
} from "@/lib/api";
import { toast } from "sonner";
import { CrmMediaPickerDialog } from "../components/CrmMediaPickerDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QK_LIST = ["admin-system-products-moderation"];

/** Лимит site-al PRODUCT_PHOTO_VERIFY_MAX_ITEMS (дефолт 24). */
const PHOTO_VERIFY_MAX = 24;

const DEFAULT_DESCRIPTION_AGENT_PROMPT = `Ты готовишь описание товара для витрины маркетплейса.

Сделай текст аккуратным и читаемым: убери мусор, дубли, служебные пометки и «воду»; если есть HTML — оставь смысл в виде обычного текста или коротких абзацев.
Удали лишние ссылки и URL (в том числе рекламные), не добавляй новых ссылок.
Сохрани смысл и важные характеристики (материал, состав, размер, уход — если они уже в тексте).
Нормализуй язык и пунктуацию.

Ответь только готовым текстом описания, без вступлений вроде «Вот описание» или пояснений.`;

function productQueryKey(id: number) {
  return ["admin-system-products", id] as const;
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

type PhotoRow = {
  id?: number;
  url: string;
  sort_order: number;
  is_primary: boolean;
  is_enabled: boolean;
  media_file_id?: number | null;
};

type AttrRow = { attr_name: string; attr_value: string };

function extractColorFromAttrs(rows: AttrRow[]): string | undefined {
  for (const r of rows) {
    const key = r.attr_name.trim().toLowerCase();
    if (!key) continue;
    if (
      key === "цвет" ||
      key === "color" ||
      key === "colour" ||
      key === "цвет товара" ||
      key.includes("цвет")
    ) {
      const v = r.attr_value.trim();
      if (v) return v;
    }
  }
  return undefined;
}

function normalizePhotoVerifyUrl(url: string): string {
  return resolveCrmMediaAssetUrl(url.trim()).replace(/\/+$/, "");
}

function photoVerifyUrlsEqual(a: string, b: string): boolean {
  return normalizePhotoVerifyUrl(a) === normalizePhotoVerifyUrl(b);
}

function buildCategoryTreeOptions(cats: CatalogCategoryItem[]): { id: number; label: string }[] {
  const byParent = new Map<number | null, CatalogCategoryItem[]>();
  cats.forEach((c) => {
    const pid = c.parent_id ?? null;
    if (!byParent.has(pid)) byParent.set(pid, []);
    byParent.get(pid)!.push(c);
  });
  const out: { id: number; label: string }[] = [];
  function walk(pid: number | null, depth: number) {
    const arr = byParent.get(pid) ?? [];
    arr.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    for (const c of arr) {
      const pad = depth > 0 ? `${"—".repeat(depth)} ` : "";
      out.push({ id: c.id, label: `${pad}${c.name}` });
      walk(c.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

export default function CrmModerationDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const id = idParam ? Number(idParam) : NaN;
  const validId = Number.isFinite(id) && id > 0;

  const { data: item, isLoading, isError, error } = useQuery({
    queryKey: validId ? productQueryKey(id) : ["admin-system-products", "invalid"],
    queryFn: () => adminSystemProductsApi.get(id),
    enabled: validId,
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["catalog-categories-flat", "moderation"],
    queryFn: () => adminCatalogApi.catalogCategoriesList({ per_page: 500, page: 1 }),
  });
  const categoryOptions = useMemo(
    () => buildCategoryTreeOptions(categoriesRes?.data ?? []),
    [categoriesRes?.data]
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  /** Ручной порядок на витрине (меньше — выше при сортировке по позиции). */
  const [listPosition, setListPosition] = useState<string>("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [attrs, setAttrs] = useState<AttrRow[]>([]);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [agentPromptOpen, setAgentPromptOpen] = useState(false);
  const [descriptionAgentPrompt, setDescriptionAgentPrompt] = useState(DEFAULT_DESCRIPTION_AGENT_PROMPT);
  const [siteAlConversationId, setSiteAlConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!validId) return;
    setDescriptionAgentPrompt(DEFAULT_DESCRIPTION_AGENT_PROMPT);
    setSiteAlConversationId(null);
  }, [validId, id]);

  useEffect(() => {
    if (!item) return;
    setName(item.name ?? "");
    setDescription(item.description ?? "");
    setPrice(item.price ?? "");
    setListPosition(String(item.list_position ?? 0));
    const cat =
      item.category_id != null
        ? item.category_id
        : item.mapping_suggested_category_id != null
          ? item.mapping_suggested_category_id
          : null;
    setCategoryId(cat != null ? String(cat) : "");
    setAttrs(
      (item.attributes ?? []).map((a) => ({
        attr_name: a.attr_name,
        attr_value: a.attr_value ?? "",
      }))
    );
    const ph = (item.photos ?? []).map((p, i) => ({
      id: p.id,
      url: p.url,
      sort_order: p.sort_order ?? i,
      is_primary: p.is_primary ?? i === 0,
      is_enabled: p.is_enabled ?? true,
      media_file_id: p.media_file_id ?? null,
    }));
    setPhotos(ph.length ? ph : []);
  }, [item]);

  const moderateMutation = useMutation({
    mutationFn: ({ status }: { status: "approved" | "needs_review" }) =>
      adminSystemProductsApi.moderate(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK_LIST });
      queryClient.invalidateQueries({ queryKey: productQueryKey(id) });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка обновления");
    },
  });

  const descriptionAgentMutation = useMutation({
    mutationFn: () => {
      const message = `${descriptionAgentPrompt.trim()}\n\n---\n\nТекущее описание товара для правки:\n\n${description.trim() || "(пусто)"}`;
      return adminSiteAlApi.chat({
        message,
        conversationId: siteAlConversationId || undefined,
      });
    },
    onSuccess: (data) => {
      if (data.conversationId) setSiteAlConversationId(data.conversationId);
      const reply = typeof data.reply === "string" ? data.reply.trim() : "";
      if (reply) {
        setDescription(reply);
        toast.success("Описание подставлено из ответа агента");
      } else {
        toast.warning("Агент не вернул текст — проверьте настройки SITE_AL в .env на сервере API");
      }
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка запроса к агенту");
    },
  });

  const photoVerifyMutation = useMutation({
    mutationFn: () => {
      const productName = name.trim() || "Товар";
      let payloadPhotos = photos
        .map((p) => ({ url: resolveCrmMediaAssetUrl(p.url.trim()) }))
        .filter((p) => /^https:\/\//i.test(p.url));
      if (payloadPhotos.length > PHOTO_VERIFY_MAX) {
        toast.info(
          `Проверяются первые ${PHOTO_VERIFY_MAX} фото (лимит сервиса). Остальные пропущены — при необходимости проверьте отдельно.`
        );
        payloadPhotos = payloadPhotos.slice(0, PHOTO_VERIFY_MAX);
      }
      if (payloadPhotos.length === 0) {
        return Promise.reject(
          new Error("Нужен хотя бы один URL с https:// (внешний сервис скачивает картинки по ссылке).")
        );
      }
      return adminSiteAlApi.verifyProductPhotos({
        productName,
        description: description.trim() || undefined,
        color: extractColorFromAttrs(attrs),
        photos: payloadPhotos,
        options: { language: "ru", minConfidence: 0.55 },
      });
    },
    onSuccess: (data) => {
      const results = data.photos ?? [];
      setPhotos((prev) =>
        prev.map((row) => {
          const abs = resolveCrmMediaAssetUrl(row.url.trim());
          const hit = results.find((r) => photoVerifyUrlsEqual(r.url, abs));
          if (!hit) return row;
          const active = hit.error ? false : !!hit.active;
          return { ...row, is_enabled: active };
        })
      );
      const inactive = results.filter((r) => (r.error ? true : !r.active)).length;
      const active = results.length - inactive;
      toast.success(
        `Проверка фото: подходят ${active}, на витрине отключены ${inactive}. Сохраните карточку, чтобы зафиксировать.`
      );
    },
    onError: (e: Error) => {
      toast.error(e.message || "Ошибка проверки фото");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const pos = listPosition.trim() === "" ? 0 : Number.parseInt(listPosition, 10);
      await adminSystemProductsApi.update(id, {
        name: name.trim(),
        description: description || null,
        price: price || null,
        category_id: categoryId ? Number(categoryId) : null,
        list_position: Number.isFinite(pos) && pos >= 0 ? pos : 0,
      });
      await adminSystemProductsApi.syncCrmAttributes(id, {
        attributes: attrs
          .filter((a) => a.attr_name.trim() !== "")
          .map((a) => ({
            attr_name: a.attr_name.trim(),
            attr_value: a.attr_value,
          })),
      });
      const ordered = photos.map((p, i) => ({
        id: p.id,
        url: p.url.trim(),
        sort_order: i,
        is_primary: !!p.is_primary,
        is_enabled: p.is_enabled,
        media_file_id: p.media_file_id ?? null,
      }));
      await adminSystemProductsApi.syncCrmPhotos(id, { photos: ordered });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: QK_LIST });
      toast.success("Карточка CRM сохранена");
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка сохранения"),
  });

  const onDragStart = (index: number) => setDragIdx(index);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (to: number) => {
    if (dragIdx === null || dragIdx === to) return;
    setPhotos((prev) => {
      const next = [...prev];
      const [m] = next.splice(dragIdx, 1);
      next.splice(to, 0, m);
      return next.map((p, i) => ({ ...p, sort_order: i }));
    });
    setDragIdx(null);
  };

  const movePhoto = (idx: number, dir: -1 | 1) => {
    setPhotos((prev) => {
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[to]] = [next[to], next[idx]];
      return next.map((p, i) => ({ ...p, sort_order: i }));
    });
  };

  const setPrimary = (idx: number) => {
    setPhotos((prev) =>
      prev.map((p, i) => ({ ...p, is_primary: i === idx }))
    );
  };

  const addAttr = () => setAttrs((a) => [...a, { attr_name: "", attr_value: "" }]);
  const removeAttr = (idx: number) => setAttrs((a) => a.filter((_, i) => i !== idx));

  const onPickMedia = (f: CrmMediaFile) => {
    setPhotos((prev) => {
      const row: PhotoRow = {
        url: resolveCrmMediaAssetUrl(f.url),
        sort_order: prev.length,
        is_primary: prev.length === 0,
        is_enabled: true,
        media_file_id: f.id,
      };
      return [...prev, row];
    });
    toast.success("Фото добавлено в список — сохраните карточку");
  };

  if (!validId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Некорректный ID</h2>
          <Link to="/crm/moderation" className="text-sm text-primary hover:underline">
            ← Вернуться к модерации
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !item) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2 max-w-md">
          <h2 className="text-xl font-semibold">Товар не найден</h2>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Не удалось загрузить данные"}
          </p>
          <Link to="/crm/moderation" className="text-sm text-primary hover:underline inline-block">
            ← Вернуться к модерации
          </Link>
        </div>
      </div>
    );
  }

  const sellerLabel = item.seller?.name ?? "—";
  const donor = item.donor_sources?.[0]?.donor;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <Dialog open={agentPromptOpen} onOpenChange={setAgentPromptOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 shrink-0" />
              Системный промпт агента
            </DialogTitle>
            <DialogDescription>
              Текст ниже задаёт правила обработки. Кнопка «Запуск» отправит промпт вместе с текущим полем «Описание» на
              сервер (ключ API хранится только на бэкенде). Повторные запуски в этой сессии продолжают диалог, если
              сервер вернул conversationId.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="agent-system-prompt">Промпт</Label>
            <Textarea
              id="agent-system-prompt"
              rows={14}
              value={descriptionAgentPrompt}
              onChange={(e) => setDescriptionAgentPrompt(e.target.value)}
              className="font-normal text-sm"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDescriptionAgentPrompt(DEFAULT_DESCRIPTION_AGENT_PROMPT)}
              >
                Сбросить промпт
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setSiteAlConversationId(null)}>
                Новый диалог
              </Button>
            </div>
            <Button type="button" onClick={() => setAgentPromptOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CrmMediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={onPickMedia} />

      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/crm/moderation">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <PageHeader
          title={`Модерация: ${item.name}`}
          description={`ID: ${item.id} · Обновлён: ${formatDate(item.updated_at)}`}
          actions={<StatusBadge status={item.status} />}
        />
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
        Редактирование ниже меняет только карточку каталога CRM (system_products). Данные парсера и
        донора в разделе «Источник» не изменяются.
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Галерея CRM
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={photos.length === 0 || photoVerifyMutation.isPending}
                  onClick={() => photoVerifyMutation.mutate()}
                  title="Сверка кадров с названием, описанием и цветом (атрибут «Цвет» / Color). Несоответствующие отключаются на витрине в форме — сохраните карточку."
                >
                  {photoVerifyMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ScanSearch className="h-4 w-4" />
                  )}
                  Проверка фото
                </Button>
                <Button size="sm" variant="secondary" className="gap-1" onClick={() => setPickerOpen(true)}>
                  <ImagePlus className="h-4 w-4" />
                  Из медиабиблиотеки
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Порядок: кнопки «вверх/вниз» или перетаскивание за ⋮⋮. Выключите переключатель, чтобы скрыть кадр на витрине.
              «Проверка фото» вызывает внешний vision-сервис по https-URL; при несоответствии переключатель «На витрине» снимается автоматически.
              Сохраните карточку, чтобы зафиксировать порядок на сервере.
            </p>
            {photos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет фото в карточке CRM. Добавьте из медиа или введите URL ниже.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {photos.map((p, idx) => {
                  const thumbUrl = resolveCrmMediaAssetUrl(p.url);
                  return (
                  <div
                    key={`${p.id ?? "n"}-${idx}`}
                    className="rounded-lg border border-border p-3 space-y-2"
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(idx)}
                  >
                    <div className="flex gap-2">
                      <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                        <button
                          type="button"
                          draggable
                          onDragStart={() => onDragStart(idx)}
                          className="cursor-grab text-muted-foreground"
                          aria-label="Перетащить"
                        >
                          <GripVertical className="h-5 w-5" />
                        </button>
                        <div className="flex flex-col gap-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => movePhoto(idx, -1)}
                            aria-label="Выше"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            disabled={idx >= photos.length - 1}
                            onClick={() => movePhoto(idx, 1)}
                            aria-label="Ниже"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                        <span className="text-[10px] tabular-nums text-muted-foreground leading-none pt-0.5">
                          {idx + 1}/{photos.length}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div
                          className="aspect-video rounded-md bg-muted bg-cover bg-center border"
                          style={
                            thumbUrl ? { backgroundImage: `url(${thumbUrl})` } : undefined
                          }
                        />
                        <Input
                          value={p.url}
                          onChange={(e) =>
                            setPhotos((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x))
                            )
                          }
                          placeholder="https://…"
                          className="text-xs"
                        />
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <label className="flex items-center gap-2">
                            <Switch
                              checked={p.is_enabled}
                              onCheckedChange={(v) =>
                                setPhotos((prev) =>
                                  prev.map((x, i) => (i === idx ? { ...x, is_enabled: v } : x))
                                )
                              }
                            />
                            На витрине
                          </label>
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="primary"
                              checked={p.is_primary}
                              onChange={() => setPrimary(idx)}
                            />
                            Главное
                          </label>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive h-7"
                            onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            Убрать
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Карточка (каталог CRM)
            </h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="sp-name">Название</Label>
                <Input id="sp-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sp-price">Цена (отображение)</Label>
                <Input id="sp-price" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="sp-list-pos">Позиция в списке (витрина)</Label>
                <Input
                  id="sp-list-pos"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  value={listPosition}
                  onChange={(e) => setListPosition(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  При сортировке блока «по позиции» меньшее число выше. Режимы «по просмотрам», «по продажам», «новинки»
                  задаются настройками блока отдельно.
                </p>
              </div>
              <div>
                <Label>Категория витрины</Label>
                <Select
                  value={categoryId === "" ? "none" : categoryId}
                  onValueChange={(v) => setCategoryId(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="— не выбрано —" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— не выбрано —</SelectItem>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <Label htmlFor="sp-desc" className="mb-0">
                    Описание
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => setAgentPromptOpen(true)}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Агент
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="gap-1.5"
                      disabled={descriptionAgentMutation.isPending}
                      onClick={() => descriptionAgentMutation.mutate()}
                    >
                      {descriptionAgentMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                      Запуск
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="sp-desc"
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="font-normal"
                />
                {siteAlConversationId ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Активен диалог агента (conversationId). «Новый диалог» в окне «Агент» начнёт цепочку заново.
                  </p>
                ) : null}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Продавец (только просмотр): {sellerLabel}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Атрибуты CRM
              </h3>
              <Button size="sm" variant="outline" type="button" onClick={addAttr}>
                Добавить
              </Button>
            </div>
            <div className="space-y-3">
              {attrs.map((a, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-end">
                  <div>
                    <Label className="text-xs">Название</Label>
                    <Input
                      value={a.attr_name}
                      onChange={(e) =>
                        setAttrs((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, attr_name: e.target.value } : x))
                        )
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs">Значение</Label>
                      <Input
                        value={a.attr_value}
                        onChange={(e) =>
                          setAttrs((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, attr_value: e.target.value } : x))
                          )
                        }
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeAttr(idx)}>
                      ×
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {donor && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-4 opacity-90">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Источник (парсер, только просмотр)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs block">Донор ID</span>
                  {donor.id}
                  {donor.external_id ? ` · ${donor.external_id}` : ""}
                </div>
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground text-xs block">Название у источника</span>
                  {donor.title ?? "—"}
                </div>
                {donor.source_url && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground text-xs block">Ссылка</span>
                    <a
                      href={donor.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary text-sm break-all hover:underline"
                    >
                      {donor.source_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Сохранение
            </h3>
            <Button
              className="w-full gap-2"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить карточку CRM
            </Button>
            <p className="text-xs text-muted-foreground">
              Сохраняет название, цену, категорию, описание, атрибуты и фото каталога.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 space-y-2">
            <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Статус</h3>
            <StatusBadge status={item.status} />
            <p className="text-xs text-muted-foreground pt-2">
              Решение модерации меняет только статус в каталоге CRM, без правок парсера.
            </p>
          </div>

          {item.status === "pending" && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Решение</h3>
              <div className="flex flex-col gap-2">
                <PermissionGate permission="moderation.approve">
                  <Button
                    size="sm"
                    className="gap-1.5 w-full"
                    disabled={moderateMutation.isPending}
                    onClick={() => moderateMutation.mutate({ status: "approved" })}
                  >
                    {moderateMutation.isPending && moderateMutation.variables?.status === "approved" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Одобрить
                  </Button>
                </PermissionGate>
                <PermissionGate permission="moderation.reject">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1.5 w-full"
                    disabled={moderateMutation.isPending}
                    onClick={() => moderateMutation.mutate({ status: "needs_review" })}
                  >
                    {moderateMutation.isPending && moderateMutation.variables?.status === "needs_review" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Отклонить
                  </Button>
                </PermissionGate>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
