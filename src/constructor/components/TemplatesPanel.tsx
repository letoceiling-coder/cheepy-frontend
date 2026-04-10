import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, FileDown, Clock } from 'lucide-react';
import { PageTemplate } from '../types';
import { isBuiltinTemplateId } from '../builtin/builtinTemplates';

interface TemplatesPanelProps {
  templates: PageTemplate[];
  onLoad: (tpl: PageTemplate) => void;
  onDelete: (id: string) => void;
}

function blocksLabelRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} блоков`;
  if (mod10 === 1) return `${n} блок`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} блока`;
  return `${n} блоков`;
}

function isLivePageOnlyTemplate(tpl: PageTemplate): boolean {
  return tpl.blocks.length === 1 && tpl.blocks[0]?.type === 'LivePageEmbed';
}

function templateSubtitle(tpl: PageTemplate): string | null {
  if (isLivePageOnlyTemplate(tpl)) {
    const path = String(tpl.blocks[0]?.settings?.path ?? '/').trim() || '/';
    return `Маршрут ${path}: полный макет страницы в одном блоке (как на сайте).`;
  }
  if (tpl.blocks.length > 1) {
    return 'Набор секций конструктора в том же порядке, что на странице.';
  }
  return null;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ templates, onLoad, onDelete }) => {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Clock className="h-8 w-8 opacity-30 mb-3" />
        <p className="text-sm font-medium">Нет сохранённых шаблонов</p>
        <p className="text-xs mt-1 opacity-70 text-center px-2">Сохраните макет или откройте встроенный шаблон слева</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1.5 min-w-0">
        {templates.map((tpl) => {
          const sub = templateSubtitle(tpl);
          return (
            <div
              key={tpl.id}
              className="border border-border rounded-md p-2 hover:border-primary/40 transition-colors bg-card/50 min-w-0"
            >
              <h4 className="text-xs font-semibold text-foreground leading-snug break-words [overflow-wrap:anywhere] pr-0">
                {tpl.name}
              </h4>
              {sub && (
                <p className="text-[10px] text-muted-foreground leading-snug mt-1 break-words [overflow-wrap:anywhere]">
                  {sub}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[10px] text-muted-foreground">
                <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 font-medium text-foreground/80">
                  {blocksLabelRu(tpl.blocks.length)}
                </span>
                <span className="shrink-0">{new Date(tpl.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex flex-wrap items-stretch gap-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex-1 min-w-[7rem]"
                  onClick={() => onLoad(tpl)}
                >
                  <FileDown className="h-3 w-3 mr-1 shrink-0" />
                  Загрузить
                </Button>
                {!isBuiltinTemplateId(tpl.id) ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(tpl.id)}
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <span className="inline-flex items-center px-2 text-[10px] text-muted-foreground border border-dashed border-border rounded-md">
                    встроенный
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
