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
import { AdvantagesItemsField, CategoryImageOverridesField, CategoryTreeField, CtaEditor, LinksEditor, MediaPickerField, ProductFeedField, SettingField } from './settings/SharedProfileFields';

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
