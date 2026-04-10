import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Trash2, FileDown, Clock, Loader2 } from 'lucide-react';
import type { ConstructorLayoutTemplateRow } from '@/lib/api';

interface TemplatesPanelProps {
  templates: ConstructorLayoutTemplateRow[];
  loading: boolean;
  loadedTemplateId: number | null;
  onLoad: (row: ConstructorLayoutTemplateRow) => void | Promise<void>;
  onDelete: (row: ConstructorLayoutTemplateRow) => void | Promise<void>;
}

function blocksLabelRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return `${n} блоков`;
  if (mod10 === 1) return `${n} блок`;
  if (mod10 >= 2 && mod10 <= 4) return `${n} блока`;
  return `${n} блоков`;
}

export const TemplatesPanel: React.FC<TemplatesPanelProps> = ({
  templates,
  loading,
  loadedTemplateId,
  onLoad,
  onDelete,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Loader2 className="h-8 w-8 opacity-50 mb-3 animate-spin" />
        <p className="text-sm">Загрузка шаблонов из БД…</p>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Clock className="h-8 w-8 opacity-30 mb-3" />
        <p className="text-sm font-medium text-center">Нет шаблонов</p>
        <p className="text-xs mt-2 opacity-80 text-center px-2">
          Выполните на бэкенде: <code className="text-[10px] bg-muted px-1 rounded">php artisan migrate</code> и{' '}
          <code className="text-[10px] bg-muted px-1 rounded">php artisan db:seed --class=ConstructorLayoutTemplatesSeeder</code>
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1.5 min-w-0">
        {templates.map((row) => {
          const singleEmbed = row.blocks_count === 1;
          const sub = singleEmbed
            ? 'Превью страницы одним блоком (встроенный маршрут). Остальные шаблоны — набор секций как на витрине.'
            : 'Секции в том же порядке, что на странице витрины. Перетаскивание и настройки — на канвасе.';
          const active = loadedTemplateId === row.id;
          return (
            <div
              key={row.id}
              className={`border rounded-md p-2 transition-colors bg-card/50 min-w-0 ${
                active ? 'border-primary/60 ring-1 ring-primary/20' : 'border-border hover:border-primary/40'
              }`}
            >
              <h4 className="text-xs font-semibold text-foreground leading-snug break-words [overflow-wrap:anywhere]">
                {row.name}
              </h4>
              <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5" title={row.template_key}>
                {row.template_key}
              </p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-1 break-words [overflow-wrap:anywhere]">{sub}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-[10px] text-muted-foreground">
                <span className="shrink-0 rounded bg-muted/80 px-1.5 py-0.5 font-medium text-foreground/80">
                  {blocksLabelRu(row.blocks_count)}
                </span>
                {row.updated_at && (
                  <span className="shrink-0">{new Date(row.updated_at).toLocaleDateString('ru-RU')}</span>
                )}
              </div>
              <div className="flex flex-wrap items-stretch gap-1 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs flex-1 min-w-[7rem]"
                  onClick={() => void onLoad(row)}
                >
                  <FileDown className="h-3 w-3 mr-1 shrink-0" />
                  Загрузить
                </Button>
                {!row.is_system ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => void onDelete(row)}
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <span className="inline-flex items-center px-2 text-[10px] text-muted-foreground border border-dashed border-border rounded-md">
                    системный
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
