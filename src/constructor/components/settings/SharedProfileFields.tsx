import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { adminCatalogApi, crmMediaApi, fetchCrmMediaBlobUrl, resolveCrmMediaAssetUrl, type CatalogCategoryItem, type CrmMediaFile, type CrmMediaFolder } from '@/lib/api';
import { CrmMediaPickerDialog } from '@/crm/components/CrmMediaPickerDialog';
import type { CtaSetting, LinkItemSetting, MediaItemSetting, ProductFeedSettings } from '@/constructor/settingsProfiles';

export const SettingField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function useMediaLibrarySource() {
  const [folders, setFolders] = useState<CrmMediaFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [files, setFiles] = useState<CrmMediaFile[]>([]);

  useEffect(() => {
    let mounted = true;
    crmMediaApi
      .folders()
      .then((res) => {
        if (!mounted) return;
        const next = Array.isArray(res.data) ? res.data : [];
        setFolders(next);
        if (!selectedFolderId && next.length > 0) setSelectedFolderId(next[0].id);
      })
      .catch(() => {
        if (!mounted) return;
        setFolders([]);
      });
    return () => {
      mounted = false;
    };
  }, [selectedFolderId]);

  useEffect(() => {
    if (!selectedFolderId) {
      setFiles([]);
      return;
    }
    let mounted = true;
    crmMediaApi
      .files({ folder_id: selectedFolderId, per_page: 200, page: 1 })
      .then((res) => {
        if (!mounted) return;
        setFiles(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setFiles([]);
      });
    return () => {
      mounted = false;
    };
  }, [selectedFolderId]);

  const refresh = () => {
    if (!selectedFolderId) return;
    crmMediaApi.files({ folder_id: selectedFolderId, per_page: 200, page: 1 }).then((res) => setFiles(Array.isArray(res.data) ? res.data : [])).catch(() => setFiles([]));
  };

  return { folders, selectedFolderId, setSelectedFolderId, files, refresh };
}

function MediaThumb({
  mediaFileId,
  url,
  alt,
  className,
}: {
  mediaFileId: number | null;
  url: string;
  alt: string;
  className?: string;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [mediaFileId, url]);

  useEffect(() => {
    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const src = blobUrl ?? resolveCrmMediaAssetUrl(url);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (!mediaFileId) return;
        if (blobUrl) return;
        void (async () => {
          try {
            const u = await fetchCrmMediaBlobUrl(mediaFileId);
            setBlobUrl((prev) => {
              if (prev) URL.revokeObjectURL(prev);
              return u;
            });
          } catch {
            // ignore: keep broken image state
          }
        })();
      }}
    />
  );
}

export function CtaEditor({ value, onChange }: { value: CtaSetting; onChange: (next: CtaSetting) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Input value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} className="h-8 text-xs" placeholder="CTA text" />
      <Input value={value.url} onChange={(e) => onChange({ ...value, url: e.target.value })} className="h-8 text-xs" placeholder="/path или https://..." />
      <Select value={value.target} onValueChange={(v) => onChange({ ...value, target: v as '_self' | '_blank' })}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="_self">self</SelectItem>
          <SelectItem value="_blank">blank</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function LinksEditor({ links, onChange }: { links: LinkItemSetting[]; onChange: (next: LinkItemSetting[]) => void }) {
  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        onClick={() => onChange([...(links ?? []), { id: uid('link'), label: 'Новая ссылка', url: '/', enabled: true, target: '_self' }])}
      >
        Добавить ссылку
      </Button>
      {(links ?? []).map((link, idx) => (
        <div key={link.id || idx} className="grid grid-cols-12 gap-2 items-center">
          <Input className="col-span-3 h-8 text-xs" value={link.label} onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))} />
          <Input className="col-span-5 h-8 text-xs" value={link.url} onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))} />
          <Select value={link.target ?? '_self'} onValueChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, target: v as '_self' | '_blank' } : x)))}>
            <SelectTrigger className="col-span-2 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="_self">self</SelectItem><SelectItem value="_blank">blank</SelectItem></SelectContent>
          </Select>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <Switch checked={Boolean(link.enabled)} onCheckedChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, enabled: v } : x)))} />
            <Button type="button" variant="outline" size="sm" className="h-8 px-2 text-xs text-destructive" onClick={() => onChange(links.filter((_, i) => i !== idx))}>×</Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryTreeField({ value, onChange }: { value: number[]; onChange: (ids: number[]) => void }) {
  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  useEffect(() => {
    let mounted = true;
    (async () => {
      const first = await adminCatalogApi.catalogCategoriesList({ per_page: 100, page: 1 });
      const total = first.meta?.total ?? first.data.length;
      const perPage = first.meta?.per_page ?? 100;
      const pages = Math.ceil(total / perPage);
      const rest = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => adminCatalogApi.catalogCategoriesList({ per_page: perPage, page: i + 2 }))) : [];
      if (!mounted) return;
      setCategories([...first.data, ...rest.flatMap((r) => r.data)]);
    })().catch(() => setCategories([]));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-md border border-border p-2 space-y-2 max-h-48 overflow-auto">
      {categories.map((cat) => {
        const checked = value.includes(cat.id);
        return (
          <label key={cat.id} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? [...value, cat.id] : value.filter((x) => x !== cat.id))}
            />
            <span>{cat.name}</span>
          </label>
        );
      })}
    </div>
  );
}

type CategoryImageOverride = {
  categoryId: number;
  mediaFileId: number | null;
  imageUrl: string;
};

export function CategoryImageOverridesField({
  selectedCategoryIds,
  value,
  onChange,
}: {
  selectedCategoryIds: number[];
  value: CategoryImageOverride[];
  onChange: (next: CategoryImageOverride[]) => void;
}) {
  const [categories, setCategories] = useState<CatalogCategoryItem[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategoryId, setPickerCategoryId] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const first = await adminCatalogApi.catalogCategoriesList({ per_page: 100, page: 1 });
      const total = first.meta?.total ?? first.data.length;
      const perPage = first.meta?.per_page ?? 100;
      const pages = Math.ceil(total / perPage);
      const rest = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, i) => adminCatalogApi.catalogCategoriesList({ per_page: perPage, page: i + 2 }))) : [];
      if (!mounted) return;
      setCategories([...first.data, ...rest.flatMap((r) => r.data)]);
    })().catch(() => setCategories([]));
    return () => {
      mounted = false;
    };
  }, []);

  const rows = selectedCategoryIds.map((id) => {
    const existing = value.find((x) => x.categoryId === id);
    return existing ?? { categoryId: id, mediaFileId: null, imageUrl: '' };
  });

  const openCategoryMediaPicker = (categoryId: number) => {
    setPickerCategoryId(categoryId);
    setPickerOpen(true);
  };

  const clearCategoryMedia = (categoryId: number) => {
    onChange(rows.map((x) => (x.categoryId === categoryId ? { ...x, mediaFileId: null, imageUrl: '' } : x)));
  };

  const handlePickCategoryMedia = (file: CrmMediaFile) => {
    if (!pickerCategoryId) return;
    onChange(
      rows.map((x) =>
        x.categoryId === pickerCategoryId
          ? { ...x, mediaFileId: file.id, imageUrl: file.url ?? '' }
          : x
      )
    );
  };

  return (
    <div className="space-y-2">
      <CrmMediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={handlePickCategoryMedia} />
      {rows.length === 0 ? <p className="text-[11px] text-muted-foreground">Сначала выберите категории.</p> : null}
      {rows.map((row) => {
        const catName = categories.find((c) => c.id === row.categoryId)?.name ?? `Категория #${row.categoryId}`;
        return (
          <div key={row.categoryId} className="rounded-md border border-border p-2 space-y-2">
            <p className="text-xs font-medium">{catName}</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => openCategoryMediaPicker(row.categoryId)}>
                {row.mediaFileId ? 'Изменить фото' : 'Выбрать фото'}
              </Button>
              {row.mediaFileId ? (
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => clearCategoryMedia(row.categoryId)}>
                  Очистить
                </Button>
              ) : null}
            </div>
            <div className="rounded-md border border-dashed border-border p-2">
              {row.imageUrl ? (
                <MediaThumb
                  mediaFileId={row.mediaFileId}
                  url={row.imageUrl}
                  alt={catName}
                  className="h-24 w-full rounded object-cover"
                />
              ) : (
                <p className="text-[11px] text-muted-foreground">Фото не выбрано</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ProductFeedField({ value, onChange }: { value: ProductFeedSettings; onChange: (next: ProductFeedSettings) => void }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <SettingField label="Лимит">
          <Input type="number" min={1} max={120} value={value.limit} className="h-8 text-xs" onChange={(e) => onChange({ ...value, limit: Number(e.target.value) || 12 })} />
        </SettingField>
        <SettingField label="Включая подкатегории">
          <Switch checked={value.includeDescendants} onCheckedChange={(v) => onChange({ ...value, includeDescendants: v })} />
        </SettingField>
      </div>
      <SettingField label="Категории">
        <CategoryTreeField value={value.categoryIds} onChange={(ids) => onChange({ ...value, categoryIds: ids })} />
      </SettingField>
    </div>
  );
}

export function MediaPickerField({ items, onChange }: { items: MediaItemSetting[]; onChange: (next: MediaItemSetting[]) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerItemIndex, setPickerItemIndex] = useState<number | null>(null);

  const openItemMediaPicker = (index: number) => {
    setPickerItemIndex(index);
    setPickerOpen(true);
  };

  const handlePickItemMedia = (file: CrmMediaFile) => {
    if (pickerItemIndex === null) return;
    onChange(items.map((x, i) => (i === pickerItemIndex ? { ...x, mediaFileId: file.id, url: file.url ?? '' } : x)));
  };

  const moveItem = (from: number, to: number) => {
    if (from === to) return;
    const next = [...(items ?? [])];
    const [sp] = next.splice(from, 1);
    next.splice(to, 0, sp);
    onChange(next);
  };

  const updateItem = (idx: number, patch: Partial<MediaItemSetting>) => {
    onChange(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  };

  return (
    <div className="space-y-2">
      <CrmMediaPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} onPick={handlePickItemMedia} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 text-xs w-full"
        onClick={() =>
          onChange([
            ...(items ?? []),
            { id: uid('media'), mediaFileId: null, url: '', title: '', subtitle: '', caption: '', alt: '', cta: { text: '', url: '', target: '_self' } },
          ])
        }
      >
        + Добавить слайд
      </Button>
      {(items ?? []).map((item, idx) => (
        <div key={item.id || idx} className="rounded-md border border-border p-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium text-muted-foreground">Слайд {idx + 1}</p>
            <div className="flex items-center gap-1">
              <Button
                type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-xs"
                disabled={idx === 0} onClick={() => moveItem(idx, idx - 1)} title="Переместить вверх"
              >↑</Button>
              <Button
                type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-xs"
                disabled={idx === (items?.length ?? 0) - 1} onClick={() => moveItem(idx, idx + 1)} title="Переместить вниз"
              >↓</Button>
              <Button
                type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-xs"
                onClick={() => onChange([...items.slice(0, idx + 1), { ...item, id: uid('media') }, ...items.slice(idx + 1)])}
                title="Дублировать"
              >⧉</Button>
              <Button
                type="button" size="sm" variant="ghost" className="h-6 w-6 p-0 text-xs text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== idx))} title="Удалить слайд"
              >✕</Button>
            </div>
          </div>

          <div className="rounded-md border border-dashed border-border overflow-hidden">
            {item.url ? (
              <div className="relative group">
                <MediaThumb
                  mediaFileId={item.mediaFileId ?? null}
                  url={item.url}
                  alt={item.alt || item.title || `Слайд ${idx + 1}`}
                  className="h-28 w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                  <Button type="button" size="sm" className="h-7 text-xs" onClick={() => openItemMediaPicker(idx)}>
                    Заменить
                  </Button>
                  <Button
                    type="button" size="sm" variant="outline" className="h-7 text-xs text-destructive"
                    onClick={() => onChange(items.map((x, i) => (i === idx ? { ...x, mediaFileId: null, url: '' } : x)))}
                  >
                    Убрать
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="w-full h-20 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent/50 transition-colors text-xs"
                onClick={() => openItemMediaPicker(idx)}
              >
                <span className="text-lg">🖼</span>
                <span>Нажмите, чтобы выбрать фото</span>
              </button>
            )}
          </div>

          <Input className="h-8 text-xs" placeholder="Заголовок слайда" value={item.title} onChange={(e) => updateItem(idx, { title: e.target.value })} />
          <Input className="h-8 text-xs" placeholder="Подзаголовок" value={item.subtitle ?? ''} onChange={(e) => updateItem(idx, { subtitle: e.target.value })} />

          <div className="rounded-md border border-border p-2 space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Кнопка на слайде</p>
            <Input className="h-8 text-xs" placeholder="Текст кнопки (например: Смотреть)" value={item.cta?.text ?? ''} onChange={(e) => updateItem(idx, { cta: { ...(item.cta ?? { url: '', target: '_self' }), text: e.target.value } })} />
            <Input className="h-8 text-xs" placeholder="Ссылка (/catalog или https://...)" value={item.cta?.url ?? ''} onChange={(e) => updateItem(idx, { cta: { ...(item.cta ?? { text: '', target: '_self' }), url: e.target.value } })} />
            <Select
              value={item.cta?.target ?? '_self'}
              onValueChange={(v) => updateItem(idx, { cta: { ...(item.cta ?? { text: '', url: '' }), target: v as '_self' | '_blank' } })}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="_self">Открыть на этой странице</SelectItem>
                <SelectItem value="_blank">Открыть в новой вкладке</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground select-none">Дополнительно (alt, подпись)</summary>
            <div className="mt-2 space-y-2">
              <Input className="h-8 text-xs" placeholder="Alt (описание изображения для SEO)" value={item.alt ?? ''} onChange={(e) => updateItem(idx, { alt: e.target.value })} />
              <Textarea className="text-xs min-h-[48px]" placeholder="Подпись (опционально)" value={item.caption} onChange={(e) => updateItem(idx, { caption: e.target.value })} />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
}
