import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { blockRegistry, getBlocksByCategory } from '../blockRegistry';
import { CATEGORY_LABELS, BlockCategory } from '../types';

interface BlockLibraryProps {
  onAddBlock: (type: string, label: string, category: BlockCategory, settings: Record<string, any>) => void;
  pageScope?: "page" | "global";
}

const GLOBAL_ONLY_BLOCKS = new Set(["Header", "Footer", "MobileBottomNav"]);

export const BlockLibrary: React.FC<BlockLibraryProps> = ({ onAddBlock, pageScope = "page" }) => {
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['hero', 'products']));

  const byCategory = getBlocksByCategory();

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const filteredByCategory = Object.entries(byCategory).reduce((acc, [cat, blocks]) => {
    const filtered = blocks.filter((b) => {
      if (pageScope === "page" && GLOBAL_ONLY_BLOCKS.has(b.type)) return false;
      if (pageScope === "global" && !GLOBAL_ONLY_BLOCKS.has(b.type)) return false;
      return (
        b.label.toLowerCase().includes(search.toLowerCase()) ||
        b.type.toLowerCase().includes(search.toLowerCase())
      );
    });
    if (filtered.length > 0) acc[cat] = filtered;
    return acc;
  }, {} as Record<string, typeof blockRegistry>);

  const getIcon = (iconName: string) => {
    const Icon = (Icons as any)[iconName];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground mb-2">Blocks</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search blocks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Object.entries(filteredByCategory).map(([cat, blocks]) => (
            <div key={cat} className="mb-1">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                {expandedCategories.has(cat) ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                {CATEGORY_LABELS[cat as BlockCategory] || cat}
                <span className="ml-auto text-[10px] opacity-60">{blocks.length}</span>
              </button>

              {expandedCategories.has(cat) && (
                <div className="ml-1 space-y-0.5">
                  {blocks.map(block => (
                    <button
                      key={block.type}
                      onClick={() => onAddBlock(block.type, block.label, block.category as BlockCategory, block.defaultSettings)}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('application/json', JSON.stringify(block));
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground/80 hover:bg-accent/10 hover:text-foreground rounded transition-all group cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                      <span className="text-muted-foreground group-hover:text-primary transition-colors">
                        {getIcon(block.icon)}
                      </span>
                      <span className="truncate">{block.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <p className="text-[10px] text-muted-foreground text-center">
          {blockRegistry.length} blocks available
        </p>
      </div>
    </div>
  );
};
