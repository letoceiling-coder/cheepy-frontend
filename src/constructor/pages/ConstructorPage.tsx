import React, { useState, useCallback } from 'react';
import { useConstructorStore } from '../useConstructorStore';
import { BlockLibrary } from '../components/BlockLibrary';
import { Canvas } from '../components/Canvas';
import { SettingsPanel } from '../components/SettingsPanel';
import { TemplatesPanel } from '../components/TemplatesPanel';
import { TopBar } from '../components/TopBar';
import { BlockCategory } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const ConstructorPage: React.FC = () => {
  const store = useConstructorStore();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const handleAddBlock = useCallback((type: string, label: string, category: BlockCategory, settings: Record<string, any>) => {
    store.addBlock(type, label, category, settings);
    toast.success(`Added: ${label}`);
  }, [store]);

  const handleDropNewBlock = useCallback((jsonData: string, index: number) => {
    try {
      const block = JSON.parse(jsonData);
      store.addBlock(block.type, block.label, block.category, block.defaultSettings || {}, index);
      toast.success(`Added: ${block.label}`);
    } catch {}
  }, [store]);

  const handleSave = useCallback(() => {
    if (store.blocks.length === 0) {
      toast.error('Nothing to save — add some blocks first');
      return;
    }
    const name = prompt('Template name:');
    if (name?.trim()) {
      store.saveTemplate(name.trim());
      toast.success('Template saved!');
    }
  }, [store]);

  const handleClear = useCallback(() => {
    if (store.blocks.length === 0) return;
    if (confirm('Clear all blocks from canvas?')) {
      store.blocks.forEach(b => store.removeBlock(b.id));
      toast.info('Canvas cleared');
    }
  }, [store]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) { e.preventDefault(); store.redo(); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') { e.preventDefault(); store.redo(); }
      if (e.key === 'Delete' && store.selectedBlockId) { store.removeBlock(store.selectedBlockId); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [store]);

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
        onSave={handleSave}
        onClear={handleClear}
        leftPanelOpen={leftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        toggleLeftPanel={() => setLeftPanelOpen(v => !v)}
        toggleRightPanel={() => setRightPanelOpen(v => !v)}
        blockCount={store.blocks.length}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        {leftPanelOpen && !store.previewMode && (
          <div className="w-64 border-r border-border bg-card shrink-0 flex flex-col animate-slide-in-right" style={{ animationDirection: 'reverse' }}>
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
                <BlockLibrary onAddBlock={handleAddBlock} />
              </TabsContent>
              <TabsContent value="templates" className="flex-1 m-0 overflow-hidden">
                <TemplatesPanel
                  templates={store.templates}
                  onLoad={store.loadTemplate}
                  onDelete={store.deleteTemplate}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Canvas */}
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

        {/* Right Panel */}
        {rightPanelOpen && !store.previewMode && (
          <div className="w-72 border-l border-border bg-card shrink-0 animate-slide-in-right">
            <SettingsPanel
              block={store.selectedBlock}
              onUpdateSettings={store.updateBlockSettings}
              onRemove={store.removeBlock}
              onDuplicate={store.duplicateBlock}
              onToggleVisibility={store.toggleBlockVisibility}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructorPage;
