import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { adminCatalogApi, crmMediaApi, type CatalogCategoryItem, type CrmMediaFile } from '@/lib/api';
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
  const [files, setFiles] = useState<CrmMediaFile[]>([]);

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
    crmMediaApi.files({ folder_id: 1, per_page: 100, page: 1 }).then((r) => setFiles(r.data)).catch(() => setFiles([]));
    return () => {
      mounted = false;
    };
  }, []);

  const rows = selectedCategoryIds.map((id) => {
    const existing = value.find((x) => x.categoryId === id);
    return existing ?? { categoryId: id, mediaFileId: null, imageUrl: '' };
  });

  const mediaOptions = files.map((f) => ({ id: f.id, label: f.original_name, url: f.url }));

  return (
    <div className="space-y-2">
      {rows.length === 0 ? <p className="text-[11px] text-muted-foreground">Сначала выберите категории.</p> : null}
      {rows.map((row) => {
        const catName = categories.find((c) => c.id === row.categoryId)?.name ?? `Категория #${row.categoryId}`;
        return (
          <div key={row.categoryId} className="rounded-md border border-border p-2 space-y-2">
            <p className="text-xs font-medium">{catName}</p>
            <Select
              value={row.mediaFileId ? String(row.mediaFileId) : 'none'}
              onValueChange={(v) => {
                const selected = v === 'none' ? null : mediaOptions.find((m) => String(m.id) === v);
                onChange(
                  rows.map((x) =>
                    x.categoryId === row.categoryId
                      ? { ...x, mediaFileId: selected ? Number(v) : null, imageUrl: selected?.url ?? '' }
                      : x
                  )
                );
              }}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Файл из Media Library" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Не выбрано</SelectItem>
                {mediaOptions.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
  const [files, setFiles] = useState<CrmMediaFile[]>([]);
  useEffect(() => {
    crmMediaApi.files({ folder_id: 1, per_page: 100, page: 1 }).then((r) => setFiles(r.data)).catch(() => setFiles([]));
  }, []);
  const options = useMemo(() => files.map((f) => ({ id: f.id, label: f.original_name, url: f.url })), [files]);

  return (
    <div className="space-y-2">
      <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => onChange([...(items ?? []), { id: uid('media'), mediaFileId: null, url: '', title: '', subtitle: '', caption: '', alt: '' }])}>
        Добавить медиа
      </Button>
      {(items ?? []).map((item, idx) => (
        <div key={item.id || idx} className="rounded-md border border-border p-2 space-y-2">
          <Select
            value={item.mediaFileId ? String(item.mediaFileId) : 'none'}
            onValueChange={(v) => {
              if (v === 'none') {
                onChange(items.map((x, i) => (i === idx ? { ...x, mediaFileId: null, url: '' } : x)));
                return;
              }
              const selected = options.find((o) => String(o.id) === v);
              onChange(items.map((x, i) => (i === idx ? { ...x, mediaFileId: Number(v), url: selected?.url ?? '' } : x)));
            }}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Выбрать файл из Media Library" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Не выбрано</SelectItem>
              {options.map((o) => <SelectItem key={o.id} value={String(o.id)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input className="h-8 text-xs" placeholder="Заголовок" value={item.title} onChange={(e) => onChange(items.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
          <Textarea className="text-xs min-h-[54px]" placeholder="Подпись" value={item.caption} onChange={(e) => onChange(items.map((x, i) => (i === idx ? { ...x, caption: e.target.value } : x)))} />
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs text-destructive" onClick={() => onChange(items.filter((_, i) => i !== idx))}>Удалить медиа</Button>
        </div>
      ))}
    </div>
  );
}
