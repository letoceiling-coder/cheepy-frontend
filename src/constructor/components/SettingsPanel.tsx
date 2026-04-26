import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import {
  BlockConfig,
  type BlockSettings,
  type FooterColumnSettings,
  type FooterSettings,
  type HeaderLinkTarget,
  type HeaderSettings,
  type NavLinkItem,
  type SocialLinkItem,
} from '../types';

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
  const supportsJsonDataTab = !isHeader && !isFooter;

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
            className={`w-full grid ${supportsJsonDataTab ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3'} h-auto gap-1 mx-3 mt-2`}
            style={{ width: 'calc(100% - 24px)' }}
          >
            <TabsTrigger value="general" className="text-xs h-7">General</TabsTrigger>
            <TabsTrigger value="layout" className="text-xs h-7">Layout</TabsTrigger>
            <TabsTrigger value="style" className="text-xs h-7">Style</TabsTrigger>
            {supportsJsonDataTab ? <TabsTrigger value="data" className="text-xs h-7">Data (JSON)</TabsTrigger> : null}
          </TabsList>

          <TabsContent value="general" className="p-3 space-y-4">
            {isHeader ? (
              <HeaderSettingsForm block={block} onUpdateSettings={onUpdateSettings} />
            ) : isFooter ? (
              <FooterSettingsForm block={block} onUpdateSettings={onUpdateSettings} />
            ) : block.type === 'LivePageEmbed' ? (
              <>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Один блок = целая страница витрины в iframe (тот же URL, что в браузере). Все секции страницы на месте, без упрощения.
                </p>
                <SettingField label="Путь (path)">
                  <Input
                    value={String(block.settings.path ?? '/')}
                    onChange={(e) => onUpdateSettings(block.id, { path: e.target.value })}
                    placeholder="/delivery"
                    className="h-8 text-xs font-mono"
                  />
                </SettingField>
                <SettingField label="Мин. высота iframe (px)">
                  <Input
                    type="number"
                    min={320}
                    max={4000}
                    value={Number(block.settings.minHeight ?? 720)}
                    onChange={(e) =>
                      onUpdateSettings(block.id, { minHeight: Number(e.target.value) || 720 })
                    }
                    className="h-8 text-xs"
                  />
                </SettingField>
                <SettingField label="Подпись под превью">
                  <Input
                    value={String(block.settings.caption ?? '')}
                    onChange={(e) => onUpdateSettings(block.id, { caption: e.target.value })}
                    placeholder="Название для подписи"
                    className="h-8 text-xs"
                  />
                </SettingField>
              </>
            ) : (
              <>
                <SettingField label="Title">
                  <Input
                    value={String(block.settings.title ?? '')}
                    onChange={(e) => onUpdateSettings(block.id, { title: e.target.value })}
                    placeholder="Section title"
                    className="h-8 text-xs"
                  />
                </SettingField>
                <SettingField label="Subtitle">
                  <Input
                    value={String(block.settings.subtitle ?? '')}
                    onChange={(e) => onUpdateSettings(block.id, { subtitle: e.target.value })}
                    placeholder="Section subtitle"
                    className="h-8 text-xs"
                  />
                </SettingField>
                <SettingField label="CTA Text">
                  <Input
                    value={String(block.settings.ctaText ?? '')}
                    onChange={(e) => onUpdateSettings(block.id, { ctaText: e.target.value })}
                    placeholder="Button text"
                    className="h-8 text-xs"
                  />
                </SettingField>
              </>
            )}
            {block.type === 'ProductGrid' && (
              <SettingField label="Product Count">
                <Slider
                value={[Number(block.settings.initialCount ?? 6)]}
                onValueChange={([v]) => onUpdateSettings(block.id, { initialCount: v })}
                  min={3} max={24} step={3}
                  className="mt-2"
                />
                <span className="text-xs text-muted-foreground mt-1">{Number(block.settings.initialCount ?? 6)} products</span>
              </SettingField>
            )}
          </TabsContent>

          <TabsContent value="layout" className="p-3 space-y-4">
            {block.type === 'LivePageEmbed' ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Колонки и отступы не применяются к превью страницы — макет задаётся самой страницей в iframe.
              </p>
            ) : null}
            {block.type !== 'LivePageEmbed' && (
              <>
                <SettingField label="Columns">
                  <Select
                    value={String(block.settings.columns ?? 'auto')}
                    onValueChange={(v) => onUpdateSettings(block.id, { columns: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="2">2 Columns</SelectItem>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="6">6 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
                <SettingField label="Padding">
                  <Slider
                    value={[Number(block.settings.padding ?? 0)]}
                    onValueChange={([v]) => onUpdateSettings(block.id, { padding: v })}
                    min={0}
                    max={64}
                    step={4}
                  />
                  <span className="text-xs text-muted-foreground">{Number(block.settings.padding ?? 0)}px</span>
                </SettingField>
                <SettingField label="Margin Top">
                  <Slider
                    value={[Number(block.settings.marginTop ?? 0)]}
                    onValueChange={([v]) => onUpdateSettings(block.id, { marginTop: v })}
                    min={0}
                    max={96}
                    step={4}
                  />
                  <span className="text-xs text-muted-foreground">{Number(block.settings.marginTop ?? 0)}px</span>
                </SettingField>
                <SettingField label="Full Width">
                  <Switch
                    checked={Boolean(block.settings.fullWidth)}
                    onCheckedChange={(v) => onUpdateSettings(block.id, { fullWidth: v })}
                  />
                </SettingField>
              </>
            )}
          </TabsContent>

          <TabsContent value="style" className="p-3 space-y-4">
            {block.type === 'LivePageEmbed' ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Стили iframe не настраиваются здесь — используйте оформление на самой странице витрины.
              </p>
            ) : null}
            {block.type !== 'LivePageEmbed' && (
              <>
                <SettingField label="Background Color">
                  <Input
                    type="color"
                    value={String(block.settings.bgColor ?? '#ffffff')}
                    onChange={(e) => onUpdateSettings(block.id, { bgColor: e.target.value })}
                    className="h-8 w-full"
                  />
                </SettingField>
                <SettingField label="Border Radius">
                  <Slider
                    value={[Number(block.settings.borderRadius ?? 0)]}
                    onValueChange={([v]) => onUpdateSettings(block.id, { borderRadius: v })}
                    min={0}
                    max={32}
                    step={2}
                  />
                  <span className="text-xs text-muted-foreground">{block.settings.borderRadius || 0}px</span>
                </SettingField>
                <SettingField label="Shadow">
                  <Select
                    value={String(block.settings.shadow ?? 'none')}
                    onValueChange={(v) => onUpdateSettings(block.id, { shadow: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
                <SettingField label="Animation">
                  <Select
                    value={String(block.settings.animation ?? 'none')}
                    onValueChange={(v) => onUpdateSettings(block.id, { animation: v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade">Fade In</SelectItem>
                      <SelectItem value="slide">Slide Up</SelectItem>
                      <SelectItem value="zoom">Zoom In</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingField>
              </>
            )}
          </TabsContent>

          {supportsJsonDataTab ? (
            <TabsContent value="data" className="p-3 space-y-2">
              <BlockSettingsJsonMerge
                blockId={block.id}
                settings={block.settings}
                onMerge={onUpdateSettings}
              />
            </TabsContent>
          ) : null}
        </Tabs>
      </ScrollArea>
    </div>
  );
};

function createEditorId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function asHeaderSettings(settings: BlockSettings): HeaderSettings {
  return settings as unknown as HeaderSettings;
}

function asFooterSettings(settings: BlockSettings): FooterSettings {
  return settings as unknown as FooterSettings;
}

function HeaderSettingsForm({
  block,
  onUpdateSettings,
}: {
  block: BlockConfig;
  onUpdateSettings: (id: string, patch: Partial<BlockSettings>) => void;
}) {
  const s = asHeaderSettings(block.settings);
  const update = (patch: Partial<HeaderSettings>) => onUpdateSettings(block.id, patch as Partial<BlockSettings>);

  const patchLinkList = (key: 'topLinks' | 'mainNavLinks', links: NavLinkItem[]) => update({ [key]: links } as Partial<HeaderSettings>);
  const patchSocialList = (links: SocialLinkItem[]) => update({ socialLinks: links });

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Ссылки верхней строки</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              patchLinkList('topLinks', [
                ...(s.topLinks ?? []),
                { id: createEditorId('top-link'), label: 'Новая ссылка', url: '/', enabled: true, target: '_self' },
              ])
            }
          >
            Добавить ссылку
          </Button>
        </div>
        <NavLinksEditor links={s.topLinks ?? []} onChange={(v) => patchLinkList('topLinks', v)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Ссылки основного меню</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              patchLinkList('mainNavLinks', [
                ...(s.mainNavLinks ?? []),
                { id: createEditorId('main-link'), label: 'Новая ссылка', url: '/', enabled: true, target: '_self' },
              ])
            }
          >
            Добавить ссылку
          </Button>
        </div>
        <NavLinksEditor links={s.mainNavLinks ?? []} onChange={(v) => patchLinkList('mainNavLinks', v)} />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Социальные ссылки</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              patchSocialList([
                ...(s.socialLinks ?? []),
                { id: createEditorId('social-link'), network: 'custom', label: 'Соцсеть', url: '#', enabled: true },
              ])
            }
          >
            Добавить соцсеть
          </Button>
        </div>
        <SocialLinksEditor links={s.socialLinks ?? []} onChange={patchSocialList} />
      </div>
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

  const patchColumn = (idx: number, col: FooterColumnSettings) => {
    const next = [...(s.columns ?? [])];
    next[idx] = col;
    update({ columns: next });
  };

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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Колонки футера</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              update({
                columns: [
                  ...(s.columns ?? []),
                  { id: createEditorId('footer-col'), title: 'Новая колонка', enabled: true, links: [] },
                ],
              })
            }
          >
            Добавить колонку
          </Button>
        </div>
        {(s.columns ?? []).map((col, idx) => (
          <div key={col.id || idx} className="rounded-md border border-border p-2 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={String(col.title ?? '')}
                onChange={(e) => patchColumn(idx, { ...col, title: e.target.value })}
                className="h-8 text-xs"
                placeholder="Заголовок колонки"
              />
              <Switch checked={Boolean(col.enabled)} onCheckedChange={(v) => patchColumn(idx, { ...col, enabled: v })} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive"
                onClick={() => update({ columns: (s.columns ?? []).filter((_, i) => i !== idx) })}
              >
                Удалить
              </Button>
            </div>
            <NavLinksEditor
              links={col.links ?? []}
              onChange={(links) => patchColumn(idx, { ...col, links })}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() =>
                patchColumn(idx, {
                  ...col,
                  links: [...(col.links ?? []), { id: createEditorId('footer-link'), label: 'Новая ссылка', url: '/', enabled: true, target: '_self' }],
                })
              }
            >
              Добавить ссылку в колонку
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Ссылки в нижней строке</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() =>
              update({
                legalLinks: [
                  ...(s.legalLinks ?? []),
                  { id: createEditorId('legal-link'), label: 'Новая legal-ссылка', url: '/privacy', enabled: true, target: '_self' },
                ],
              })
            }
          >
            Добавить ссылку
          </Button>
        </div>
        <NavLinksEditor links={s.legalLinks ?? []} onChange={(v) => update({ legalLinks: v })} />
      </div>
    </div>
  );
}

function NavLinksEditor({
  links,
  onChange,
}: {
  links: NavLinkItem[];
  onChange: (next: NavLinkItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {links.map((link, idx) => (
        <div key={link.id || idx} className="grid grid-cols-12 gap-2 items-center">
          <Input
            value={link.label}
            onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
            className="col-span-4 h-8 text-xs"
            placeholder="Текст"
          />
          <Input
            value={link.url}
            onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
            className="col-span-5 h-8 text-xs"
            placeholder="/path или https://..."
          />
          <Select
            value={(link.target ?? '_self') as HeaderLinkTarget}
            onValueChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, target: v as HeaderLinkTarget } : x)))}
          >
            <SelectTrigger className="col-span-2 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_self">self</SelectItem>
              <SelectItem value="_blank">blank</SelectItem>
            </SelectContent>
          </Select>
          <div className="col-span-1 flex items-center justify-end gap-1">
            <Switch checked={Boolean(link.enabled)} onCheckedChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, enabled: v } : x)))} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-destructive"
              onClick={() => onChange(links.filter((_, i) => i !== idx))}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
      {links.length === 0 ? <p className="text-[11px] text-muted-foreground">Список пуст.</p> : null}
    </div>
  );
}

function SocialLinksEditor({
  links,
  onChange,
}: {
  links: SocialLinkItem[];
  onChange: (next: SocialLinkItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {links.map((link, idx) => (
        <div key={link.id || idx} className="grid grid-cols-12 gap-2 items-center">
          <Select
            value={link.network}
            onValueChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, network: v as SocialLinkItem['network'] } : x)))}
          >
            <SelectTrigger className="col-span-3 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="vk">VK</SelectItem>
              <SelectItem value="ok">OK</SelectItem>
              <SelectItem value="telegram">Telegram</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={link.label}
            onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
            className="col-span-3 h-8 text-xs"
            placeholder="Label"
          />
          <Input
            value={link.url}
            onChange={(e) => onChange(links.map((x, i) => (i === idx ? { ...x, url: e.target.value } : x)))}
            className="col-span-5 h-8 text-xs"
            placeholder="https://..."
          />
          <div className="col-span-1 flex items-center justify-end gap-1">
            <Switch checked={Boolean(link.enabled)} onCheckedChange={(v) => onChange(links.map((x, i) => (i === idx ? { ...x, enabled: v } : x)))} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs text-destructive"
              onClick={() => onChange(links.filter((_, i) => i !== idx))}
            >
              ×
            </Button>
          </div>
        </div>
      ))}
      {links.length === 0 ? <p className="text-[11px] text-muted-foreground">Список пуст.</p> : null}
    </div>
  );
}

/** Слияние JSON-объекта в settings — для произвольных ключей (источник данных, categorySlug, лимиты и т.д.) */
function BlockSettingsJsonMerge({
  blockId,
  settings,
  onMerge,
}: {
  blockId: string;
  settings: BlockSettings;
  onMerge: (id: string, patch: Partial<BlockSettings>) => void;
}) {
  const [raw, setRaw] = useState(() => JSON.stringify(settings ?? {}, null, 2));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRaw(JSON.stringify(settings ?? {}, null, 2));
    setError(null);
  }, [blockId]);

  const apply = () => {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        setError('Нужен JSON-объект { ... }');
        return;
      }
      const next = parsed as Record<string, unknown>;
      onMerge(blockId, { ...settings, ...next });
      setError(null);
    } catch {
      setError('Невалидный JSON');
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground leading-snug">
        Дополнительные поля для этого экземпляра блока на странице. Сливаются с уже заданными в General/Layout. Подходит для
        categorySlug, initialCount, dataSource и любых будущих параметров.
      </p>
      <Textarea
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setError(null);
        }}
        className="font-mono text-[11px] min-h-[160px]"
        spellCheck={false}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="button" size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={apply}>
        Применить JSON к настройкам
      </Button>
    </div>
  );
}

const SettingField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    {children}
  </div>
);
