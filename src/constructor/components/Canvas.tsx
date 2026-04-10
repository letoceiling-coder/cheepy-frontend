import React, { useRef, useCallback } from 'react';
import { Trash2, Copy, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { BlockConfig, DeviceMode } from '../types';
import { BlockRenderer } from '../blockRenderer';
import { Button } from '@/components/ui/button';

interface CanvasProps {
  blocks: BlockConfig[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: 'up' | 'down') => void;
  onToggleVisibility: (id: string) => void;
  onReorder: (from: number, to: number) => void;
  onDropNewBlock: (data: string, index: number) => void;
  deviceMode: DeviceMode;
  previewMode: boolean;
}

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export const Canvas: React.FC<CanvasProps> = ({
  blocks, selectedBlockId, onSelectBlock, onRemoveBlock,
  onDuplicateBlock, onMoveBlock, onToggleVisibility, onReorder,
  onDropNewBlock, deviceMode, previewMode,
}) => {
  const dragItemRef = useRef<number | null>(null);
  const dragOverRef = useRef<number | null>(null);

  const handleDragStart = (idx: number) => {
    dragItemRef.current = idx;
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverRef.current = idx;
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const jsonData = e.dataTransfer.getData('application/json');
    
    if (jsonData) {
      // New block from library
      onDropNewBlock(jsonData, idx);
    } else if (dragItemRef.current !== null && dragItemRef.current !== idx) {
      onReorder(dragItemRef.current, idx);
    }
    dragItemRef.current = null;
    dragOverRef.current = null;
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      onDropNewBlock(jsonData, blocks.length);
    }
  };

  return (
    <div className="flex-1 bg-muted/30 overflow-auto p-4" onClick={() => onSelectBlock(null)}>
      <div
        className="mx-auto bg-background rounded-lg shadow-sm border border-border transition-all duration-300 min-h-[400px]"
        style={{ maxWidth: DEVICE_WIDTHS[deviceMode] }}
        onDragOver={e => e.preventDefault()}
        onDrop={handleCanvasDrop}
      >
        {blocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center mb-4">
              <GripVertical className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm font-medium">Drag blocks here to start building</p>
            <p className="text-xs mt-1 opacity-60">or click a block in the left panel to add it</p>
          </div>
        )}

        {blocks.map((block, idx) => (
          <div
            key={block.id}
            className={`relative group transition-all ${
              block.hidden ? 'opacity-30' : ''
            } ${
              selectedBlockId === block.id && !previewMode
                ? 'ring-2 ring-primary ring-offset-2'
                : ''
            } ${!previewMode ? 'hover:ring-1 hover:ring-primary/30' : ''}`}
            onClick={e => { e.stopPropagation(); if (!previewMode) onSelectBlock(block.id); }}
            draggable={!previewMode}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDrop={e => handleDrop(e, idx)}
          >
            {/* Block toolbar */}
            {!previewMode && (
              <div className="absolute top-9 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/95 backdrop-blur-sm border border-border rounded-md shadow-sm p-0.5">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onMoveBlock(block.id, 'up'); }}>
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onMoveBlock(block.id, 'down'); }}>
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onDuplicateBlock(block.id); }}>
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onToggleVisibility(block.id); }}>
                  {block.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={e => { e.stopPropagation(); onRemoveBlock(block.id); }}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Постоянная подпись блока — читаемый текст, не только по hover */}
            {!previewMode && (
              <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-2 py-1.5 bg-card/95 backdrop-blur-sm border-b border-border text-xs">
                <span className="font-semibold text-foreground truncate max-w-[min(100%,14rem)]">{block.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">{block.type}</span>
              </div>
            )}

            {/* Контент: без обрезки по вертикали; в режиме правок отключаем клики внутри для перетаскивания */}
            <div className={`${previewMode ? '' : 'pointer-events-none'} overflow-x-auto overflow-y-visible`}>
              <BlockRenderer block={block} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
