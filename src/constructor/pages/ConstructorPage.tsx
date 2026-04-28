import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConstructorStore } from '../useConstructorStore';
import { BlockLibrary } from '../components/BlockLibrary';
import { Canvas } from '../components/Canvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { TemplatesPanel } from '../components/TemplatesPanel';
import { TopBar } from '../components/TopBar';
import { BlockCategory } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { adminCmsApi, adminConstructorLayoutApi, ApiError, type ConstructorLayoutTemplateRow } from '@/lib/api';
import { mapBlockConfigsToCmsPayload, mapCmsApiBlocksToBlockConfigs } from '../cmsBlockMap';

const GLOBAL_ONLY_BLOCK_TYPES = new Set(['Header', 'Footer', 'MobileBottomNav']);

const ConstructorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const store = useConstructorStore();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // Изменяемая ширина правой панели настроек (перетаскиванием за левый край).
  const RIGHT_PANEL_MIN = 288;
  const RIGHT_PANEL_MAX = 720;
  const RIGHT_PANEL_KEY = 'constructor.rightPanelWidth';
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 320;
    const raw = window.localStorage.getItem(RIGHT_PANEL_KEY);
    const n = raw ? Number(raw) : NaN;
    if (!Number.isFinite(n)) return 320;
    return Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, Math.round(n)));
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(RIGHT_PANEL_KEY, String(rightPanelWidth));
    } catch {
      // ignore
    }
  }, [rightPanelWidth]);
  const startResizeRight = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = rightPanelWidth;
    const onMove = (ev: MouseEvent) => {
      const dx = startX - ev.clientX; // тащим влево → ширина увеличивается
      const next = Math.min(RIGHT_PANEL_MAX, Math.max(RIGHT_PANEL_MIN, startWidth + dx));
      setRightPanelWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  }, [rightPanelWidth]);
  const [cmsPageTitle, setCmsPageTitle] = useState<string | null>(null);
  const [cmsSaving, setCmsSaving] = useState(false);
  const [cmsLoading, setCmsLoading] = useState(false);

  const [layoutRows, setLayoutRows] = useState<ConstructorLayoutTemplateRow[]>([]);
  const [layoutListLoading, setLayoutListLoading] = useState(true);
  const [loadedLayoutTemplateId, setLoadedLayoutTemplateId] = useState<number | null>(null);
  const [currentTemplateScope, setCurrentTemplateScope] = useState<'page' | 'global'>('page');
  const [currentTemplateType, setCurrentTemplateType] = useState<'system' | 'content'>('content');
  const [currentTemplateEditable, setCurrentTemplateEditable] = useState(true);

  const cmsPageId = useMemo(() => {
    const raw = searchParams.get('cmsPageId')?.trim();
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [searchParams]);

  const cmsVersionId = useMemo(() => {
    const raw = searchParams.get('cmsVersionId')?.trim();
    if (!raw || !/^\d+$/.test(raw)) return null;
    return Number(raw);
  }, [searchParams]);

  const cmsMode = cmsPageId !== null && cmsVersionId !== null;

  const refreshLayoutTemplates = useCallback(async () => {
    try {
      const res = await adminConstructorLayoutApi.list();
      setLayoutRows(res.data);
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить список шаблонов';
      toast.error(msg);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLayoutListLoading(true);
    adminConstructorLayoutApi
      .list()
      .then((res) => {
        if (!cancelled) setLayoutRows(res.data);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить шаблоны конструктора';
          toast.error(msg);
        }
      })
      .finally(() => {
        if (!cancelled) setLayoutListLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!cmsMode) {
      setCmsPageTitle(null);
      return;
    }
    let cancelled = false;
    setCmsLoading(true);
    Promise.all([adminCmsApi.get(cmsPageId!), adminCmsApi.getVersion(cmsPageId!, cmsVersionId!)])
      .then(([detail, ver]) => {
        if (cancelled) return;
        setCmsPageTitle(detail.title);
        const rows = ver.version.blocks as Parameters<typeof mapCmsApiBlocksToBlockConfigs>[0];
        store.replaceBlocks(mapCmsApiBlocksToBlockConfigs(rows));
        setLoadedLayoutTemplateId(null);
        setCurrentTemplateScope('page');
        setCurrentTemplateType('content');
        setCurrentTemplateEditable(true);
        toast.success('Макет загружен из CMS');
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить страницу CMS';
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setCmsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cmsMode, cmsPageId, cmsVersionId, store.replaceBlocks]);

  const handleAddBlock = useCallback(
    (type: string, label: string, category: BlockCategory, settings: Record<string, unknown>) => {
      if (currentTemplateScope === 'page' && GLOBAL_ONLY_BLOCK_TYPES.has(type)) {
        toast.error('Header/Footer/MobileBottomNav настраиваются в отдельном глобальном шаблоне.');
        return;
      }
      store.addBlock(type, label, category, settings);
      toast.success(`Добавлено: ${label}`);
    },
    [currentTemplateScope, store]
  );

  const handleDropNewBlock = useCallback(
    (jsonData: string, index: number) => {
      try {
        const block = JSON.parse(jsonData) as { type: string; label: string; category: BlockCategory; defaultSettings?: Record<string, unknown> };
        if (currentTemplateScope === 'page' && GLOBAL_ONLY_BLOCK_TYPES.has(block.type)) {
          toast.error('Header/Footer/MobileBottomNav настраиваются только в глобальном шаблоне.');
          return;
        }
        store.addBlock(block.type, block.label, block.category, block.defaultSettings || {}, index);
        toast.success(`Добавлено: ${block.label}`);
      } catch {
        /* ignore */
      }
    },
    [currentTemplateScope, store]
  );

  const handleSaveLayoutTemplate = useCallback(async () => {
    if (cmsMode) {
      toast.info('Для страницы из CRM используйте «Сохранить в CMS».');
      return;
    }
    if (store.blocks.length === 0) {
      toast.error('Нет блоков для сохранения');
      return;
    }
    const payload = { blocks: mapBlockConfigsToCmsPayload(store.blocks) };
    try {
      if (loadedLayoutTemplateId != null) {
        if (!currentTemplateEditable) {
          toast.error('Этот шаблон заблокирован для редактирования.');
          return;
        }
        await adminConstructorLayoutApi.syncBlocks(loadedLayoutTemplateId, payload);
        toast.success('Шаблон сохранён в БД');
      } else {
        const name = prompt('Название нового шаблона:');
        if (!name?.trim()) return;
        const created = await adminConstructorLayoutApi.create({ name: name.trim(), ...payload });
        setLoadedLayoutTemplateId(created.id);
        toast.success('Шаблон создан в БД');
      }
      await refreshLayoutTemplates();
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : 'Ошибка сохранения шаблона';
      toast.error(msg);
    }
  }, [cmsMode, currentTemplateEditable, loadedLayoutTemplateId, refreshLayoutTemplates, store.blocks]);

  const handleSaveToCms = useCallback(async () => {
    if (!cmsPageId || !cmsVersionId) return;
    if (store.blocks.length === 0) {
      toast.error('Нет блоков для сохранения');
      return;
    }
    setCmsSaving(true);
    try {
      await adminCmsApi.syncBlocks(cmsPageId, cmsVersionId, {
        blocks: mapBlockConfigsToCmsPayload(store.blocks),
      });
      toast.success('Блоки сохранены в CMS');
    } catch (e: unknown) {
      const msg = e instanceof ApiError ? e.message : 'Ошибка сохранения в CMS';
      toast.error(msg);
    } finally {
      setCmsSaving(false);
    }
  }, [cmsPageId, cmsVersionId, store.blocks]);

  const handleLoadLayoutTemplate = useCallback(
    async (row: ConstructorLayoutTemplateRow) => {
      try {
        const detail = await adminConstructorLayoutApi.show(row.id);
        store.replaceBlocks(
          mapCmsApiBlocksToBlockConfigs(
            detail.blocks.map((b) => ({
              id: b.id,
              block_type: b.block_type,
              sort_order: b.sort_order,
              settings: b.settings,
              client_key: b.client_key,
              is_enabled: b.is_enabled,
              is_visible: b.is_visible,
              is_required: b.is_required,
              is_locked: b.is_locked,
              slot_key: b.slot_key,
            }))
          )
        );
        setLoadedLayoutTemplateId(row.id);
        setCurrentTemplateScope(detail.page_scope);
        setCurrentTemplateType(detail.template_type);
        setCurrentTemplateEditable(detail.is_editable);
        toast.success(`Загружено: ${row.name}`);
      } catch (e: unknown) {
        const msg = e instanceof ApiError ? e.message : 'Не удалось загрузить шаблон';
        toast.error(msg);
      }
    },
    [store]
  );

  const handleDeleteLayoutTemplate = useCallback(
    async (row: ConstructorLayoutTemplateRow) => {
      if (row.is_system) return;
      if (!confirm(`Удалить шаблон «${row.name}»?`)) return;
      try {
        await adminConstructorLayoutApi.remove(row.id);
        if (loadedLayoutTemplateId === row.id) setLoadedLayoutTemplateId(null);
        toast.success('Шаблон удалён');
        await refreshLayoutTemplates();
      } catch (e: unknown) {
        const msg = e instanceof ApiError ? e.message : 'Не удалось удалить';
        toast.error(msg);
      }
    },
    [loadedLayoutTemplateId, refreshLayoutTemplates]
  );

  const handleClear = useCallback(() => {
    if (store.blocks.length === 0) return;
    if (confirm('Очистить канвас?')) {
      store.blocks.forEach((b) => store.removeBlock(b.id));
      setLoadedLayoutTemplateId(null);
      toast.info('Канвас очищен');
    }
  }, [store]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        store.undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        store.redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        store.redo();
      }
      if (e.key === 'Delete' && store.selectedBlockId) {
        store.removeBlock(store.selectedBlockId);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (cmsMode) {
          if (!cmsSaving) void handleSaveToCms();
        } else {
          void handleSaveLayoutTemplate();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmsMode, cmsSaving, handleSaveLayoutTemplate, handleSaveToCms, store]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <TopBar
        deviceMode={store.deviceMode}
        setDeviceMode={store.setDeviceMode}
        previewMode={store.previewMode}
        setPreviewMode={store.setPreviewMode}
        onUndo={store.undo}
        onRedo={store.redo}
        canUndo={store.canUndo}
        canRedo={store.canRedo}
        onSave={handleSaveLayoutTemplate}
        onClear={handleClear}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        toggleLeftPanel={() => setLeftPanelOpen((v) => !v)}
        toggleRightPanel={() => setRightPanelOpen((v) => !v)}
        blockCount={store.blocks.length}
        onSaveToCms={cmsMode ? handleSaveToCms : undefined}
        cmsSaving={cmsSaving}
        cmsPageTitle={cmsPageTitle ?? undefined}
      />

      {cmsLoading && (
        <div className="shrink-0 border-b border-border bg-muted/40 px-3 py-1.5 text-center text-xs text-muted-foreground">
          Загрузка макета из CMS…
        </div>
      )}
      <div className="shrink-0 border-b border-border bg-card px-3 py-1 text-center text-[11px] text-muted-foreground">
        Режим шаблона: {currentTemplateScope === 'global' ? 'глобальный (Header/Footer)' : 'страница'} ·{' '}
        {currentTemplateType === 'system' ? 'системный' : 'контентный'} ·{' '}
        {currentTemplateEditable ? 'редактируемый' : 'только чтение'}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {leftPanelOpen && !store.previewMode && (
          <div
            className="w-[20rem] sm:w-80 max-w-[min(100vw-2rem,22rem)] border-r border-border bg-card shrink-0 flex flex-col animate-slide-in-right"
            style={{ animationDirection: 'reverse' }}
          >
            <Tabs defaultValue="blocks" className="flex flex-col h-full">
              <TabsList className="w-full grid grid-cols-2 h-9 rounded-none border-b border-border bg-transparent">
                <TabsTrigger value="blocks" className="text-xs h-8 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Blocks
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs h-8 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Templates
                </TabsTrigger>
              </TabsList>
              <TabsContent value="blocks" className="flex-1 m-0 overflow-hidden">
                <BlockLibrary onAddBlock={handleAddBlock} pageScope={currentTemplateScope} />
              </TabsContent>
              <TabsContent value="templates" className="flex-1 m-0 overflow-hidden">
                <TemplatesPanel
                  templates={layoutRows}
                  loading={layoutListLoading}
                  loadedTemplateId={loadedLayoutTemplateId}
                  onLoad={handleLoadLayoutTemplate}
                  onDelete={handleDeleteLayoutTemplate}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <Canvas
          blocks={store.blocks}
          selectedBlockId={store.selectedBlockId}
          onSelectBlock={store.setSelectedBlockId}
          onRemoveBlock={store.removeBlock}
          onDuplicateBlock={store.duplicateBlock}
          onMoveBlock={store.moveBlock}
          onToggleVisibility={store.toggleBlockVisibility}
          onReorder={store.reorderBlocks}
          onDropNewBlock={handleDropNewBlock}
          deviceMode={store.deviceMode}
          previewMode={store.previewMode}
        />

        {rightPanelOpen && !store.previewMode && (
          <div
            className="relative border-l border-border bg-card shrink-0 animate-slide-in-right"
            style={{ width: `${rightPanelWidth}px` }}
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Изменить ширину панели настроек"
              tabIndex={0}
              onMouseDown={startResizeRight}
              onDoubleClick={() => setRightPanelWidth(320)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                  e.preventDefault();
                  setRightPanelWidth((w) => Math.min(RIGHT_PANEL_MAX, w + 16));
                } else if (e.key === 'ArrowRight') {
                  e.preventDefault();
                  setRightPanelWidth((w) => Math.max(RIGHT_PANEL_MIN, w - 16));
                }
              }}
              className="absolute -left-1 top-0 bottom-0 w-2 cursor-ew-resize z-10 group"
              title="Перетащите, чтобы изменить ширину (двойной клик — сброс)"
            >
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/60 transition-colors" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-1 rounded-full bg-border group-hover:bg-primary transition-colors" />
            </div>
            <SettingsPanel
              block={store.selectedBlock}
              onUpdateSettings={store.updateBlockSettings}
              onRemove={store.removeBlock}
              onDuplicate={store.duplicateBlock}
              onToggleVisibility={store.toggleBlockVisibility}
              onSetWidth={(preset) => {
                const map = { s: 320, m: 440, l: 600 } as const;
                setRightPanelWidth(map[preset] ?? 320);
              }}
              currentWidth={rightPanelWidth}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructorPage;
