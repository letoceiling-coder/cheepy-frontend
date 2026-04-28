import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { BlockConfig, type BlockSettings, type FooterSettings, type HeaderSettings } from '../types';
import { getSettingsProfileForBlockType, normalizeBlockProfileSettings } from '../settingsProfiles';
import { AdvantagesItemsField, CategoryImageOverridesField, CategoryTreeField, CtaEditor, LinksEditor, MediaPickerField, ProductFeedField, ProductPickerField, SettingField } from './settings/SharedProfileFields';
import { CrmMediaPickerDialog } from '@/crm/components/CrmMediaPickerDialog';
import { resolveCrmMediaAssetUrl, type CrmMediaFile, type SystemProductItem } from '@/lib/api';

interface SettingsPanelProps {
  block: BlockConfig | null;
  /** Частичное слияние в block.settings (произвольные ключи для разных страниц / данных) */
  onUpdateSettings: (id: string, settings: Partial<BlockSettings>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  block, onUpdateSettings, onRemove, onDuplicate, onToggleVisibility,
}) => {
  if (!block) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-3">
          <span className="text-lg opacity-40">⚙</span>
        </div>
        <p className="text-sm font-medium">No block selected</p>
        <p className="text-xs mt-1 opacity-60 text-center">Click a block on the canvas to edit its settings</p>
      </div>
    );
  }

  const isHeader = block.type === 'Header';
  const isFooter = block.type === 'Footer';
  const profile = block ? getSettingsProfileForBlockType(block.type) : 'P-UTILITY';
  const normalized = block ? normalizeBlockProfileSettings(block.type, block.settings as Record<string, unknown>) : null;

  return (
    <div className="flex flex-col h-full">
      {/* Block header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-foreground leading-snug break-words min-w-0 flex-1 [overflow-wrap:anywhere]">
            {block.label}
          </h3>
          <span className="text-[10px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full shrink-0">{block.category}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => onDuplicate(block.id)}>
            <Copy className="h-3 w-3 mr-1" /> Clone
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onToggleVisibility(block.id)}>
            {block.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onRemove(block.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <Tabs defaultValue="general" className="w-full">
          <TabsList
            className="w-full grid grid-cols-2 sm:grid-cols-3 h-auto gap-1 mx-3 mt-2"
            style={{ width: 'calc(100% - 24px)' }}
          >
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs h-7">Layout</TabsTrigger>
            <TabsTrigger value="style" className="text-xs h-7">Style</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="p-3 space-y-4">
            {isHeader ? (
              <HeaderSettingsForm block={block} onUpdateSettings={onUpdateSettings} />
            ) : isFooter ? (
              <FooterSettingsForm block={block} onUpdateSettings={onUpdateSettings} />
            ) : (
              <ProfileSettingsForm block={block} normalized={normalized} profile={profile} onUpdateSettings={onUpdateSettings} />
            )}
          </TabsContent>

          <TabsContent value="layout" className="p-3 space-y-4">
            <SettingField label="Показывать блок">
              <Switch checked={!(block.hidden ?? false)} onCheckedChange={(v) => onToggleVisibility(block.id)} />
            </SettingField>
          </TabsContent>

          <TabsContent value="style" className="p-3 space-y-4">
            <SettingField label="CSS class (optional)">
              <Input
                value={String((block.settings as Record<string, unknown>).className ?? '')}
                onChange={(e) => onUpdateSettings(block.id, { className: e.target.value })}
                className="h-8 text-xs"
              />
            </SettingField>
          </TabsContent>
        </Tabs>
      </ScrollArea>
    </div>
  );
};

function asHeaderSettings(settings: BlockSettings): HeaderSettings {
  return settings as unknown as HeaderSettings;
}

function asFooterSettings(settings: BlockSettings): FooterSettings {
  return settings as unknown as FooterSettings;
}

function HeaderSettingsForm({ block, onUpdateSettings }: { block: BlockConfig; onUpdateSettings: (id: string, patch: Partial<BlockSettings>) => void }) {
  const s = asHeaderSettings(block.settings);
  const update = (patch: Partial<HeaderSettings>) => onUpdateSettings(block.id, patch as Partial<BlockSettings>);

  return (
    <div className="space-y-4">
      <SettingField label="Бренд (логотип-текст)">
        <Input value={String(s.brandText ?? '')} onChange={(e) => update({ brandText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Плейсхолдер поиска">
        <Input value={String(s.searchPlaceholder ?? '')} onChange={(e) => update({ searchPlaceholder: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label="Показать верхнюю строку">
          <Switch checked={Boolean(s.showTopBar)} onCheckedChange={(v) => update({ showTopBar: v })} />
        </SettingField>
        <SettingField label="Показать главное меню">
          <Switch checked={Boolean(s.showMainNav)} onCheckedChange={(v) => update({ showMainNav: v })} />
        </SettingField>
        <SettingField label="Соцсети в меню">
          <Switch checked={Boolean(s.showSocialLinks)} onCheckedChange={(v) => update({ showSocialLinks: v })} />
        </SettingField>
        <SettingField label="Иконка аккаунта">
          <Switch checked={Boolean(s.showAccount)} onCheckedChange={(v) => update({ showAccount: v })} />
        </SettingField>
        <SettingField label="Иконка избранного">
          <Switch checked={Boolean(s.showFavorites)} onCheckedChange={(v) => update({ showFavorites: v })} />
        </SettingField>
        <SettingField label="Иконка корзины">
          <Switch checked={Boolean(s.showCart)} onCheckedChange={(v) => update({ showCart: v })} />
        </SettingField>
      </div>

      <SettingField label="Текст ссылки доставки (верхняя строка)">
        <Input value={String(s.deliveryCtaText ?? '')} onChange={(e) => update({ deliveryCtaText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Текст кнопки продавца (верхняя строка)">
        <Input value={String(s.sellerCtaText ?? '')} onChange={(e) => update({ sellerCtaText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Текст «Оптовым покупателям»">
        <Input value={String(s.wholesaleText ?? '')} onChange={(e) => update({ wholesaleText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Текст «Правила площадки»">
        <Input value={String(s.rulesText ?? '')} onChange={(e) => update({ rulesText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Текст «Доставка»">
        <Input value={String(s.deliveryText ?? '')} onChange={(e) => update({ deliveryText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Текст «Поддержка»">
        <Input value={String(s.supportText ?? '')} onChange={(e) => update({ supportText: e.target.value })} className="h-8 text-xs" />
      </SettingField>

      <SettingField label="Ссылки верхней строки"><LinksEditor links={s.topLinks ?? []} onChange={(v) => update({ topLinks: v })} /></SettingField>

      <SettingField label="Ссылки основного меню"><LinksEditor links={s.mainNavLinks ?? []} onChange={(v) => update({ mainNavLinks: v })} /></SettingField>
    </div>
  );
}

function FooterSettingsForm({
  block,
  onUpdateSettings,
}: {
  block: BlockConfig;
  onUpdateSettings: (id: string, patch: Partial<BlockSettings>) => void;
}) {
  const s = asFooterSettings(block.settings);
  const update = (patch: Partial<FooterSettings>) => onUpdateSettings(block.id, patch as Partial<BlockSettings>);

  return (
    <div className="space-y-4">
      <SettingField label="Бренд (логотип-текст)">
        <Input value={String(s.brandText ?? '')} onChange={(e) => update({ brandText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <SettingField label="Описание компании">
        <Textarea value={String(s.description ?? '')} onChange={(e) => update({ description: e.target.value })} className="text-xs min-h-[70px]" />
      </SettingField>
      <SettingField label="Текст copyright">
        <Input value={String(s.copyrightText ?? '')} onChange={(e) => update({ copyrightText: e.target.value })} className="h-8 text-xs" />
      </SettingField>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label="Показывать контакты">
          <Switch checked={Boolean(s.showContacts)} onCheckedChange={(v) => update({ showContacts: v })} />
        </SettingField>
        <SettingField label="Показывать legal-ссылки">
          <Switch checked={Boolean(s.showBottomLegal)} onCheckedChange={(v) => update({ showBottomLegal: v })} />
        </SettingField>
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Контакты</Label>
        <Input value={String(s.contacts?.city ?? '')} onChange={(e) => update({ contacts: { ...s.contacts, city: e.target.value } })} className="h-8 text-xs" placeholder="Город" />
        <Input value={String(s.contacts?.phone ?? '')} onChange={(e) => update({ contacts: { ...s.contacts, phone: e.target.value } })} className="h-8 text-xs" placeholder="Телефон" />
        <Input value={String(s.contacts?.email ?? '')} onChange={(e) => update({ contacts: { ...s.contacts, email: e.target.value } })} className="h-8 text-xs" placeholder="Email" />
      </div>

      <SettingField label="Ссылки legal"><LinksEditor links={s.legalLinks ?? []} onChange={(v) => update({ legalLinks: v })} /></SettingField>
    </div>
  );
}

function ProfileSettingsForm({
  block,
  normalized,
  profile,
  onUpdateSettings,
}: {
  block: BlockConfig;
  normalized: ReturnType<typeof normalizeBlockProfileSettings> | null;
  profile: ReturnType<typeof getSettingsProfileForBlockType>;
  onUpdateSettings: (id: string, settings: Partial<BlockSettings>) => void;
}) {
  if (!normalized) return null;
  const update = (patch: Record<string, unknown>) => onUpdateSettings(block.id, patch);

  if (profile === 'P-HERO-PRODUCT') {
    return <HeroProductSettingsForm block={block} normalized={normalized as any} update={update} />;
  }

  return (
    <div className="space-y-3">
      <SettingField label="Title"><Input className="h-8 text-xs" value={normalized.title ?? ''} onChange={(e) => update({ title: e.target.value })} /></SettingField>
      <SettingField label="Subtitle"><Input className="h-8 text-xs" value={normalized.subtitle ?? ''} onChange={(e) => update({ subtitle: e.target.value })} /></SettingField>
      {block.type === 'MarketplaceAdvantages' ? (
        <SettingField label="Преимущества">
          <AdvantagesItemsField
            items={Array.isArray((normalized as any).items) ? (normalized as any).items : []}
            onChange={(items) => update({ items })}
          />
        </SettingField>
      ) : null}
      {profile === 'P-PRODUCT-FEED' ? <ProductFeedField value={normalized.feed} onChange={(feed) => update({ feed })} /> : null}
      {profile === 'P-CATEGORY-FEED' ? (
        <>
          <SettingField label="Категории источника">
            <CategoryTreeField value={normalized.feed.categoryIds ?? []} onChange={(ids) => update({ feed: { ...normalized.feed, categoryIds: ids } })} />
          </SettingField>
          <SettingField label="Фото для выбранных категорий">
            <CategoryImageOverridesField
              selectedCategoryIds={normalized.feed.categoryIds ?? []}
              value={normalized.feed.imageOverrides ?? []}
              onChange={(imageOverrides) => update({ feed: { ...normalized.feed, imageOverrides } })}
            />
          </SettingField>
        </>
      ) : null}
      {profile === 'P-HERO-MEDIA' || profile === 'P-BANNER-MEDIA' || profile === 'P-VIDEO-MEDIA' || profile === 'P-LOOKBOOK-MEDIA' ? (
        <SettingField label="Медиа"><MediaPickerField items={normalized.media} onChange={(media) => update({ media })} /></SettingField>
      ) : null}
      {profile === 'P-HERO-MEDIA' ? (
        <SettingField label="Затемнение/оверлей (%)">
          <Input
            type="number"
            min={0}
            max={100}
            className="h-8 text-xs"
            value={Number((normalized as any).overlayOpacity ?? 30)}
            onChange={(e) => update({ overlayOpacity: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
          />
        </SettingField>
      ) : null}
      {profile === 'P-HERO-MEDIA' ? <SettingField label="CTA"><CtaEditor value={normalized.cta} onChange={(cta) => update({ cta })} /></SettingField> : null}
      {profile === 'P-NAV-GLOBAL' ? <SettingField label="Ссылки"><LinksEditor links={(normalized as any).links ?? []} onChange={(links) => update({ links })} /></SettingField> : null}
      {profile === 'P-UTILITY' ? (
        <>
          <SettingField label="Path"><Input className="h-8 text-xs" value={String((normalized as any).path ?? '/')} onChange={(e) => update({ path: e.target.value })} /></SettingField>
          <SettingField label="Caption"><Input className="h-8 text-xs" value={String((normalized as any).caption ?? '')} onChange={(e) => update({ caption: e.target.value })} /></SettingField>
        </>
      ) : null}
    </div>
  );
}

type HeroProductPhotoLocal = { mediaFileId: number | null; url: string };

type HeroProductItemLocal = {
  id: string;
  productId: number | null;
  label: string;
  productTitle: string;
  productDescription: string;
  mediaFileId: number | null;
  imageUrl: string;
  additionalPhotos: HeroProductPhotoLocal[];
  priceText: string;
  oldPriceText: string;
  discountText: string;
  cta: { text: string; url: string; target: '_self' | '_blank' };
};

function makeNewItem(): HeroProductItemLocal {
  return {
    id: `hp-${Math.random().toString(36).slice(2, 9)}`,
    productId: null,
    label: 'Товар недели',
    productTitle: '',
    productDescription: '',
    mediaFileId: null,
    imageUrl: '',
    additionalPhotos: [],
    priceText: '',
    oldPriceText: '',
    discountText: '',
    cta: { text: 'Купить сейчас', url: '', target: '_self' },
  };
}

function HeroProductSettingsForm({
  block: _block,
  normalized,
  update,
}: {
  block: BlockConfig;
  normalized: {
    items: HeroProductItemLocal[];
    autoplaySeconds: number;
  };
  update: (patch: Record<string, unknown>) => void;
}) {
  const items = Array.isArray(normalized.items) ? normalized.items : [];
  const autoplay = Number.isFinite(normalized.autoplaySeconds) ? Number(normalized.autoplaySeconds) : 0;

  const setItems = (next: HeroProductItemLocal[]) => update({ items: next });
  const updateItem = (idx: number, patch: Partial<HeroProductItemLocal>) =>
    setItems(items.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  const moveItem = (from: number, to: number) => {
    if (from === to || to < 0 || to >= items.length) return;
    const next = [...items];
    const [sp] = next.splice(from, 1);
    next.splice(to, 0, sp);
    setItems(next);
  };

  return (
    <div className="space-y-4">
      <SettingField label="Автослайд (секунды между слайдами; 0 — выкл)">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            max={60}
            step={1}
            className="h-8 text-xs w-24"
            value={autoplay}
            onChange={(e) => {
              const n = Number(e.target.value);
              const safe = Number.isFinite(n) ? Math.max(0, Math.min(60, Math.round(n))) : 0;
              update({ autoplaySeconds: safe });
            }}
          />
          <span className="text-[11px] text-muted-foreground">сек (0–60). Активен только при двух и более товарах.</span>
        </div>
      </SettingField>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium">Товары ({items.length})</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setItems([...items, makeNewItem()])}
          >
            + Добавить товар
          </Button>
        </div>

        {items.length === 0 ? <p className="text-[11px] text-muted-foreground">Добавьте хотя бы один товар.</p> : null}

        {items.map((item, idx) => (
          <HeroProductItemEditor
            key={item.id || idx}
            index={idx}
            total={items.length}
            item={item}
            onChange={(patch) => updateItem(idx, patch)}
            onMoveUp={() => moveItem(idx, idx - 1)}
            onMoveDown={() => moveItem(idx, idx + 1)}
            onDuplicate={() =>
              setItems([...items.slice(0, idx + 1), { ...item, id: `hp-${Math.random().toString(36).slice(2, 9)}` }, ...items.slice(idx + 1)])
            }
            onRemove={() => setItems(items.filter((_, i) => i !== idx))}
          />
        ))}
      </div>
    </div>
  );
}

function HeroProductItemEditor({
  index,
  total,
  item,
  onChange,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  index: number;
  total: number;
  item: HeroProductItemLocal;
  onChange: (patch: Partial<HeroProductItemLocal>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const [collapsed, setCollapsed] = React.useState(true);
  const [mediaPicker, setMediaPicker] = React.useState<{ mode: 'main' | 'extra'; extraIndex?: number } | null>(null);
  const [productSnapshot, setProductSnapshot] = React.useState<SystemProductItem | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const id = item.productId;
    if (!id) {
      setProductSnapshot(null);
      return;
    }
    if (productSnapshot && productSnapshot.id === id) return;
    void (async () => {
      try {
        const { adminSystemProductsApi } = await import('@/lib/api');
        const p = await adminSystemProductsApi.get(id);
        if (!cancelled) setProductSnapshot(p);
      } catch {
        if (!cancelled) setProductSnapshot(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [item.productId, productSnapshot]);

  const applyProduct = (p: SystemProductItem) => {
    setProductSnapshot(p);
    const enabledPhotos = (p.photos ?? []).filter((x) => x.is_enabled !== false);
    const primary = enabledPhotos.find((x) => x.is_primary) ?? enabledPhotos[0];
    const rest = enabledPhotos
      .filter((x) => x !== primary)
      .map((x) => ({ mediaFileId: x.media_file_id ?? null, url: x.url ?? '' }))
      .filter((x) => x.mediaFileId || x.url);
    onChange({
      productId: p.id,
      productTitle: p.name ?? '',
      productDescription: p.description ?? '',
      mediaFileId: primary?.media_file_id ?? null,
      imageUrl: primary?.url ?? p.thumbnail_url ?? '',
      additionalPhotos: rest,
      priceText: p.price ?? '',
      oldPriceText: '',
      discountText: '',
      cta: { ...item.cta, url: `/product/${p.id}` },
    });
  };

  const handlePickMedia = (file: CrmMediaFile) => {
    if (!mediaPicker) return;
    if (mediaPicker.mode === 'main') {
      onChange({ mediaFileId: file.id, imageUrl: file.url ?? '' });
    } else if (mediaPicker.mode === 'extra' && typeof mediaPicker.extraIndex === 'number') {
      const i = mediaPicker.extraIndex;
      if (i === -1) {
        onChange({ additionalPhotos: [...item.additionalPhotos, { mediaFileId: file.id, url: file.url ?? '' }] });
      } else {
        onChange({
          additionalPhotos: item.additionalPhotos.map((x, k) => (k === i ? { mediaFileId: file.id, url: file.url ?? '' } : x)),
        });
      }
    }
    setMediaPicker(null);
  };

  const heading =
    item.productTitle?.trim() ||
    productSnapshot?.name ||
    (item.productId ? `Товар #${item.productId}` : `Товар ${index + 1}`);

  return (
    <div className="rounded-md border border-border p-2 space-y-2">
      <CrmMediaPickerDialog open={Boolean(mediaPicker)} onOpenChange={(v) => !v && setMediaPicker(null)} onPick={handlePickMedia} />

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex-1 min-w-0 text-left text-xs font-medium truncate hover:text-primary"
          onClick={() => setCollapsed((v) => !v)}
        >
          <span className="text-muted-foreground mr-1">#{index + 1}</span>
          {heading}
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" disabled={index === 0} onClick={onMoveUp} title="Вверх">↑</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" disabled={index === total - 1} onClick={onMoveDown} title="Вниз">↓</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" onClick={onDuplicate} title="Дублировать">⧉</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs text-destructive" onClick={onRemove} title="Удалить">✕</Button>
          <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0 text-xs" onClick={() => setCollapsed((v) => !v)} title={collapsed ? 'Раскрыть' : 'Свернуть'}>
            {collapsed ? '▸' : '▾'}
          </Button>
        </div>
      </div>

      {!collapsed ? (
        <div className="space-y-3 pt-1">
          <SettingField label="Метка-плашка">
            <Input
              className="h-8 text-xs"
              value={item.label ?? ''}
              placeholder="Например: Товар недели"
              onChange={(e) => onChange({ label: e.target.value })}
            />
          </SettingField>

          <SettingField label="Товар (поиск по ID, названию, артикулу)">
            <ProductPickerField
              value={productSnapshot}
              onPick={applyProduct}
              onClear={() => {
                setProductSnapshot(null);
                onChange({
                  productId: null,
                  productTitle: '',
                  productDescription: '',
                  mediaFileId: null,
                  imageUrl: '',
                  additionalPhotos: [],
                  priceText: '',
                  oldPriceText: '',
                  discountText: '',
                  cta: { ...item.cta, url: '' },
                });
              }}
            />
          </SettingField>

          <SettingField label="Заголовок (override)">
            <Input
              className="h-8 text-xs"
              value={item.productTitle ?? ''}
              placeholder={productSnapshot?.name ?? 'Введите заголовок'}
              onChange={(e) => onChange({ productTitle: e.target.value })}
            />
          </SettingField>

          <SettingField label="Описание (override)">
            <Textarea
              className="text-xs min-h-[60px]"
              value={item.productDescription ?? ''}
              placeholder={productSnapshot?.description ?? 'Введите описание'}
              onChange={(e) => onChange({ productDescription: e.target.value })}
            />
          </SettingField>

          <SettingField label="Главное изображение">
            <div className="rounded-md border border-dashed border-border overflow-hidden">
              {item.imageUrl || item.mediaFileId ? (
                <div className="relative group">
                  <img
                    src={resolveCrmMediaAssetUrl(item.imageUrl)}
                    alt={item.productTitle || 'preview'}
                    className="h-32 w-full object-contain bg-muted/40"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                    <Button type="button" size="sm" className="h-7 text-xs" onClick={() => setMediaPicker({ mode: 'main' })}>
                      Заменить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs text-destructive"
                      onClick={() => onChange({ mediaFileId: null, imageUrl: '' })}
                    >
                      Убрать
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full h-24 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent/50 transition-colors text-xs"
                  onClick={() => setMediaPicker({ mode: 'main' })}
                >
                  <span className="text-lg">🖼</span>
                  <span>Выбрать фото из медиатеки</span>
                </button>
              )}
            </div>
          </SettingField>

          <SettingField label={`Дополнительные фото (галерея): ${item.additionalPhotos.length}`}>
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {item.additionalPhotos.map((ph, i) => (
                  <div key={i} className="relative group rounded-md border border-border overflow-hidden bg-muted/40">
                    <img
                      src={resolveCrmMediaAssetUrl(ph.url)}
                      alt={`extra-${i}`}
                      className="h-20 w-full object-contain"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                      <Button type="button" size="sm" className="h-6 text-[10px] px-2" onClick={() => setMediaPicker({ mode: 'extra', extraIndex: i })}>
                        Заменить
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-6 text-[10px] px-2 text-destructive"
                        onClick={() => onChange({ additionalPhotos: item.additionalPhotos.filter((_, k) => k !== i) })}
                      >
                        Убрать
                      </Button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="h-20 rounded-md border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:bg-accent/50 text-[11px]"
                  onClick={() => setMediaPicker({ mode: 'extra', extraIndex: -1 })}
                >
                  <span className="text-base">＋</span>
                  <span>Добавить</span>
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                На витрине покажутся миниатюрами под главным фото с переключением.
              </p>
            </div>
          </SettingField>

          <div className="grid grid-cols-3 gap-2">
            <SettingField label="Цена">
              <Input
                className="h-8 text-xs"
                value={item.priceText ?? ''}
                placeholder="4 990 ₽"
                onChange={(e) => onChange({ priceText: e.target.value })}
              />
            </SettingField>
            <SettingField label="Старая цена">
              <Input
                className="h-8 text-xs"
                value={item.oldPriceText ?? ''}
                placeholder="6 990 ₽"
                onChange={(e) => onChange({ oldPriceText: e.target.value })}
              />
            </SettingField>
            <SettingField label="Скидка">
              <Input
                className="h-8 text-xs"
                value={item.discountText ?? ''}
                placeholder="-28%"
                onChange={(e) => onChange({ discountText: e.target.value })}
              />
            </SettingField>
          </div>

          <SettingField label="Кнопка-CTA">
            <CtaEditor value={item.cta} onChange={(cta) => onChange({ cta })} />
          </SettingField>
        </div>
      ) : null}
    </div>
  );
}
