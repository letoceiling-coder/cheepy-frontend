import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { crmMediaApi, type CrmMediaFile, type CrmMediaFolder } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, FolderOpen, Loader2 } from "lucide-react";
import { CrmMediaFilePreview } from "./CrmMediaFilePreview";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (file: CrmMediaFile) => void;
};

export function CrmMediaPickerDialog({ open, onOpenChange, onPick }: Props) {
  const [stack, setStack] = useState<CrmMediaFolder[]>([]);
  const current = stack[stack.length - 1] ?? null;
  const parentId = current?.id ?? null;

  useEffect(() => {
    if (open) setStack([]);
  }, [open]);

  const { data: childrenFolders = [], isLoading: lf } = useQuery({
    queryKey: ["crm-media-picker", "folders", parentId],
    queryFn: async () =>
      (await crmMediaApi.folders(parentId === null ? {} : { parent_id: parentId })).data,
    enabled: open,
  });

  const browseId = current?.id ?? 0;

  const { data: filesRes, isLoading: lfiles } = useQuery({
    queryKey: ["crm-media-picker", "files", browseId],
    queryFn: () => crmMediaApi.files({ folder_id: browseId, per_page: 60 }),
    enabled: open && browseId > 0,
  });

  const files = filesRes?.data ?? [];

  const enter = (f: CrmMediaFolder) => {
    if (f.slug === "__trash__") return;
    setStack((s) => [...s, f]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-6xl h-[88vh] max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Выбор файла из медиабиблиотеки</DialogTitle>
        </DialogHeader>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-1 items-center">
          <button type="button" className="hover:underline" onClick={() => setStack([])}>
            Корень
          </button>
          {stack.map((f, i) => (
            <span key={f.id} className="flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <button
                type="button"
                className="hover:underline"
                onClick={() => setStack((s) => s.slice(0, i + 1))}
              >
                {f.name}
              </button>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[420px] flex-1">
          <div className="rounded-md border p-2 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">Папки</p>
            {lf ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ul className="space-y-0.5 max-h-[58vh] overflow-auto">
                {parentId !== null && (
                  <li>
                    <button
                      type="button"
                      className="text-sm text-primary"
                      onClick={() => setStack((s) => s.slice(0, -1))}
                    >
                      ← Назад
                    </button>
                  </li>
                )}
                {childrenFolders
                  .filter((f) => f.slug !== "__trash__")
                  .map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        className="flex items-center gap-2 text-sm w-full text-left hover:bg-muted rounded px-1"
                        onClick={() => enter(f)}
                      >
                        <FolderOpen className="h-4 w-4 shrink-0" />
                        {f.name}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
          <div className="rounded-md border p-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Файлы</p>
            {!browseId && (
              <p className="text-sm text-muted-foreground">Откройте папку слева.</p>
            )}
            {lfiles && browseId > 0 && <Loader2 className="h-6 w-6 animate-spin" />}
            {browseId > 0 && !lfiles && (
              <ScrollArea className="h-[58vh]">
                <div className="grid grid-cols-3 gap-2 pr-2">
                  {files.map((f: CrmMediaFile) => (
                    <button
                      key={f.id}
                      type="button"
                      className="rounded border p-1 text-left hover:border-primary"
                      onClick={() => {
                        onPick(f);
                        onOpenChange(false);
                      }}
                    >
                      <div className="aspect-square overflow-hidden rounded bg-muted">
                        <CrmMediaFilePreview file={f} />
                      </div>
                      <p className="text-[10px] truncate mt-0.5">{f.original_name}</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Закрыть
        </Button>
      </DialogContent>
    </Dialog>
  );
}
