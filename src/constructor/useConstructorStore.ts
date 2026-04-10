import { useState, useCallback, useRef } from 'react';
import { BlockConfig, DeviceMode, HistoryEntry, PageTemplate, type BlockSettings } from './types';
import { getBuiltinPageTemplates, isBuiltinTemplateId } from './builtin/builtinTemplates';

const MAX_HISTORY = 50;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function loadTemplatesFromStorage(): PageTemplate[] {
  const builtins = getBuiltinPageTemplates();
  let user: PageTemplate[] = [];
  try {
    user = JSON.parse(localStorage.getItem('constructor_templates') || '[]');
  } catch { /* ignore */ }
  const userClean = user.filter((t) => t?.id && !isBuiltinTemplateId(t.id));
  return [...builtins, ...userClean];
}

function persistUserTemplatesOnly(list: PageTemplate[]) {
  const userOnly = list.filter((t) => !isBuiltinTemplateId(t.id));
  localStorage.setItem('constructor_templates', JSON.stringify(userOnly));
}

export function useConstructorStore() {
  const [blocks, setBlocks] = useState<BlockConfig[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [previewMode, setPreviewMode] = useState(false);
  const [templates, setTemplates] = useState<PageTemplate[]>(loadTemplatesFromStorage);

  const historyRef = useRef<HistoryEntry[]>([]);
  const historyIndexRef = useRef(-1);

  const pushHistory = useCallback((newBlocks: BlockConfig[]) => {
    const entry: HistoryEntry = { blocks: JSON.parse(JSON.stringify(newBlocks)), timestamp: Date.now() };
    // Truncate forward history
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(entry);
    if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift();
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const updateBlocks = useCallback((newBlocks: BlockConfig[]) => {
    setBlocks(newBlocks);
    pushHistory(newBlocks);
  }, [pushHistory]);

  const addBlock = useCallback((type: string, label: string, category: BlockConfig['category'], settings: BlockConfig['settings'], index?: number) => {
    const block: BlockConfig = { id: generateId(), type, label, category, settings: { ...settings } };
    setBlocks(prev => {
      const next = [...prev];
      if (index !== undefined) next.splice(index, 0, block);
      else next.push(block);
      pushHistory(next);
      return next;
    });
    setSelectedBlockId(block.id);
    return block.id;
  }, [pushHistory]);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const next = prev.filter(b => b.id !== id);
      pushHistory(next);
      return next;
    });
    setSelectedBlockId(sel => sel === id ? null : sel);
  }, [pushHistory]);

  const moveBlock = useCallback((id: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const clone: BlockConfig = { ...JSON.parse(JSON.stringify(prev[idx])), id: generateId() };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const toggleBlockVisibility = useCallback((id: string) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, hidden: !b.hidden } : b);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const updateBlockSettings = useCallback((id: string, settings: Partial<BlockSettings>) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, settings: { ...b.settings, ...settings } } : b);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const undo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current].blocks)));
    }
  }, []);

  const redo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current].blocks)));
    }
  }, []);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const saveTemplate = useCallback((name: string) => {
    const tpl: PageTemplate = { id: generateId(), name, blocks: JSON.parse(JSON.stringify(blocks)), createdAt: new Date().toISOString() };
    setTemplates(prev => {
      const next = [...prev, tpl];
      persistUserTemplatesOnly(next);
      return next;
    });
  }, [blocks]);

  const loadTemplate = useCallback((tpl: PageTemplate) => {
    const loaded = JSON.parse(JSON.stringify(tpl.blocks)).map((b: BlockConfig) => ({ ...b, id: generateId() }));
    updateBlocks(loaded);
  }, [updateBlocks]);

  /** Полная замена канваса (загрузка из CMS и т.п.) */
  const replaceBlocks = useCallback((next: BlockConfig[]) => {
    setSelectedBlockId(null);
    updateBlocks(JSON.parse(JSON.stringify(next)));
  }, [updateBlocks]);

  const deleteTemplate = useCallback((id: string) => {
    if (isBuiltinTemplateId(id)) return;
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      persistUserTemplatesOnly(next);
      return next;
    });
  }, []);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  return {
    blocks, selectedBlock, selectedBlockId, setSelectedBlockId,
    deviceMode, setDeviceMode, previewMode, setPreviewMode,
    templates, addBlock, removeBlock, moveBlock, duplicateBlock,
    toggleBlockVisibility, updateBlockSettings, reorderBlocks, replaceBlocks,
    undo, redo, canUndo, canRedo,
    saveTemplate, loadTemplate, deleteTemplate,
  };
}
