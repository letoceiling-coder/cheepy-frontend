import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, FileDown, Clock } from 'lucide-react';
import { PageTemplate } from '../types';

interface TemplatesPanelProps {
  templates: PageTemplate[];
  onLoad: (tpl: PageTemplate) => void;
  onDelete: (id: string) => void;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ templates, onLoad, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <Clock className="h-8 w-8 opacity-30 mb-3" />
        <p className="text-sm font-medium">No saved templates</p>
        <p className="text-xs mt-1 opacity-60 text-center">Save your current layout as a template to reuse later</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-2">
        {templates.map(tpl => (
          <div key={tpl.id} className="border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-medium text-foreground truncate">{tpl.name}</h4>
              <span className="text-[10px] text-muted-foreground">{tpl.blocks.length} blocks</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2">
              {new Date(tpl.createdAt).toLocaleDateString()}
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => onLoad(tpl)}>
                <FileDown className="h-3 w-3 mr-1" /> Load
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(tpl.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
