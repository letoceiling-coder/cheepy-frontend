import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crmMediaApi, type CrmMediaFile, type CrmMediaFolder } from "@/lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ChevronRight,
  FolderPlus,
  FolderOpen,
  Loader2,
  Trash2,
  RotateCcw,
  Upload,
  Pencil,
  Search,
} from "lucide-react";
import { CrmMediaFilePreview } from "../components/CrmMediaFilePreview";

const QK = ["crm-media"];

async function fetchAllFoldersFlat(): Promise<CrmMediaFolder[]> {
  const out: CrmMediaFolder[] = [];
  async function walk(parentId: number | null) {
    const r = await crmMediaApi.folders(
      parentId === null ? {} : { parent_id: parentId }
    );
    for (const f of r.data) {
      out.push(f);
      await walk(f.id);
    }
  }
  await walk(null);
  return out;
}

export default function CrmMediaPage() {
  const qc = useQueryClient();
  const [stack, setStack] = useState<CrmMediaFolder[]>([]);
  const current = stack[stack.length - 1] ?? null;
  const parentId = current?.id ?? null;

  const { data: childrenFolders = [], isLoading: loadingFolders } = useQuery({
    queryKey: [...QK, "folders", parentId],
    queryFn: async () => (await crmMediaApi.folders(parentId === null ? {} : { parent_id: parentId })).data,
  });

  const [filePage, setFilePage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: trashId } = useQuery({
    queryKey: [...QK, "trash-id"],
    queryFn: async () => {
      const r = await crmMediaApi.folders({});
      return r.data.find((f) => f.slug === "__trash__")?.id ?? null;
    },
    staleTime: 60_000,
  });

  const browseFolderId = current?.id ?? 0;

  const { data: filesRes, isLoading: loadingFiles } = useQuery({
    queryKey: [...QK, "files", browseFolderId, filePage, debouncedSearch],
    queryFn: () =>
      crmMediaApi.files({
        folder_id: browseFolderId,
        page: filePage,
        per_page: 40,
        search: debouncedSearch || undefined,
      }),
    enabled: browseFolderId > 0,
  });

  const files = filesRes?.data ?? [];
  const meta = filesRes?.meta;

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<CrmMediaFolder | null>(null);
  const [renameName, setRenameName] = useState("");

  const [selected, setSelected] = useState<number[]>([]);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveTargetId, setMoveTargetId] = useState<number | "">("");
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: allFolders = [] } = useQuery({
    queryKey: [...QK, "all-flat"],
    queryFn: fetchAllFoldersFlat,
    enabled: moveOpen,
  });

  const createFolder = useMutation({
    mutationFn: () => crmMediaApi.createFolder({ name: newFolderName.trim(), parent_id: parentId }),
    onSuccess: () => {
      toast.success("Папка создана");
      setNewFolderName("");
      setNewFolderOpen(false);
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const renameFolder = useMutation({
    mutationFn: () =>
      crmMediaApi.updateFolder(renameTarget!.id, { name: renameName.trim() }),
    onSuccess: () => {
      toast.success("Переименовано");
      setRenameTarget(null);
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteFolder = useMutation({
    mutationFn: (id: number) => crmMediaApi.deleteFolder(id),
    onSuccess: () => {
      toast.success("Папка удалена");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMut = useMutation({
    mutationFn: async (fileList: File[]) => {
      if (!browseFolderId) throw new Error("Выберите папку");
      setUploadProgress(0);
      const { data, failures } = await crmMediaApi.upload(
        browseFolderId,
        fileList,
        (p) => setUploadProgress(p)
      );
      setUploadProgress(100);
      return { data, failures };
    },
    onSuccess: ({ data, failures }) => {
      qc.invalidateQueries({ queryKey: QK });
      if (data.length && failures.length) {
        toast.success(`Загружено файлов: ${data.length}. Не удалось: ${failures.length}.`);
      } else if (data.length) {
        toast.success(data.length > 1 ? `Загружено файлов: ${data.length}` : "Загружено");
      } else if (failures.length) {
        toast.error("Не удалось загрузить файлы");
      }
      for (const f of failures) {
        const hint =
          f.status === 413
            ? "слишком большой для сервера (413). На сервере нужны upload_max_filesize / post_max_size в PHP и client_max_body_size в nginx."
            : f.message;
        toast.error(`${f.name}: ${hint}`);
      }
      setTimeout(() => setUploadProgress(0), 600);
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setUploadProgress(0);
    },
  });

  const moveMut = useMutation({
    mutationFn: () =>
      crmMediaApi.moveFiles({
        file_ids: selected,
        folder_id: Number(moveTargetId),
      }),
    onSuccess: () => {
      toast.success("Перемещено");
      setSelected([]);
      setMoveOpen(false);
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreMut = useMutation({
    mutationFn: (id: number) => crmMediaApi.restoreFile(id),
    onSuccess: () => {
      toast.success("Восстановлено");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const emptyTrashMut = useMutation({
    mutationFn: () => crmMediaApi.emptyTrash(),
    onSuccess: () => {
      toast.success("Корзина очищена");
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const quickToTrashMut = useMutation({
    mutationFn: (fileId: number) => {
      if (!trashId) throw new Error("Папка корзины не найдена");
      return crmMediaApi.moveFiles({ file_ids: [fileId], folder_id: trashId });
    },
    onSuccess: (_data, fileId) => {
      toast.success("Файл в корзине");
      setSelected((s) => s.filter((x) => x !== fileId));
      qc.invalidateQueries({ queryKey: QK });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onDropUpload = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const list = Array.from(e.dataTransfer.files || []);
      if (list.length && browseFolderId) uploadMut.mutate(list);
    },
    [browseFolderId, uploadMut]
  );

  const enterFolder = (f: CrmMediaFolder) => {
    setStack((s) => [...s, f]);
    setFilePage(1);
    setSelected([]);
  };

  const goRoot = () => {
    setStack([]);
    setFilePage(1);
    setSelected([]);
  };

  const isTrashView = current?.slug === "__trash__";

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl">
      <PageHeader
        title="Медиабиблиотека"
        description="Файлы для CRM: папки, загрузка, корзина. Парсер и донорские товары не затрагиваются."
      />

      <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground">
        <button type="button" className="hover:text-foreground" onClick={goRoot}>
          Корень
        </button>
        {stack.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight className="h-4 w-4" />
            <button
              type="button"
              className="hover:text-foreground"
              onClick={() => {
                setStack((s) => s.slice(0, i + 1));
                setFilePage(1);
              }}
            >
              {f.name}
            </button>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Папки</h3>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() => setNewFolderOpen(true)}
              disabled={isTrashView}
            >
              <FolderPlus className="h-4 w-4" />
              Новая
            </Button>
          </div>
          {loadingFolders ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <ul className="space-y-1">
              {parentId !== null && (
                <li>
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => {
                      setStack((s) => s.slice(0, -1));
                      setFilePage(1);
                    }}
                  >
                    ← Назад
                  </button>
                </li>
              )}
              {childrenFolders.map((f) => (
                <li
                  key={f.id}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1 hover:bg-muted/60"
                >
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-left flex-1 min-w-0"
                    onClick={() => enterFolder(f)}
                  >
                    <FolderOpen
                      className={`h-4 w-4 shrink-0 ${f.slug === "__trash__" ? "text-destructive" : ""}`}
                    />
                    <span className="truncate">{f.name}</span>
                  </button>
                  {!f.is_system && (
                    <div className="flex gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          setRenameTarget(f);
                          setRenameName(f.name);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          if (confirm(`Удалить папку «${f.name}»?`)) deleteFolder.mutate(f.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="lg:col-span-2 rounded-lg border border-border bg-card p-4 space-y-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropUpload}
        >
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <h3 className="text-sm font-medium">
              Файлы {current ? `· ${current.name}` : ""}
            </h3>
            <div className="flex flex-wrap gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8 h-9 w-48"
                  placeholder="Поиск…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const list = Array.from(e.target.files || []);
                    if (list.length && browseFolderId) uploadMut.mutate(list);
                    e.target.value = "";
                  }}
                />
                <Button size="sm" variant="secondary" asChild disabled={!browseFolderId || isTrashView}>
                  <span className="gap-1 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Загрузить
                  </span>
                </Button>
              </label>
              {selected.length > 0 && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
                    Переместить ({selected.length})
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!trashId) {
                        toast.error("Папка корзины не найдена");
                        return;
                      }
                      crmMediaApi
                        .moveFiles({ file_ids: selected, folder_id: trashId })
                        .then(() => {
                          toast.success("В корзине");
                          setSelected([]);
                          qc.invalidateQueries({ queryKey: QK });
                        })
                        .catch((e: Error) => toast.error(e.message));
                    }}
                  >
                    Удалить
                  </Button>
                </>
              )}
              {isTrashView && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Окончательно удалить все файлы из корзины?")) emptyTrashMut.mutate();
                  }}
                >
                  Очистить корзину
                </Button>
              )}
            </div>
          </div>

          {uploadMut.isPending && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Загрузка файлов...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {!browseFolderId && (
            <p className="text-sm text-muted-foreground">
              Откройте папку слева (например создайте «Загрузки» в корне).
            </p>
          )}

          {loadingFiles && browseFolderId ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
          ) : (
            <ScrollArea className="h-[min(60vh,520px)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-3">
                {files.map((f: CrmMediaFile) => {
                  const checked = selected.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      className={`rounded-lg border p-2 space-y-2 ${checked ? "border-primary" : "border-border"}`}
                    >
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelected((s) =>
                              checked ? s.filter((x) => x !== f.id) : [...s, f.id]
                            )
                          }
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="relative group aspect-square rounded overflow-hidden border border-border/60">
                            {!isTrashView && trashId ? (
                              <Button
                                type="button"
                                size="icon"
                                variant="destructive"
                                className="absolute right-1 top-1 z-20 h-8 w-8 shadow-md opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                                disabled={quickToTrashMut.isPending}
                                aria-label="В корзину"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  quickToTrashMut.mutate(f.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : null}
                            <CrmMediaFilePreview file={f} />
                          </div>
                          <p className="text-xs truncate mt-1" title={f.original_name}>
                            {f.original_name}
                          </p>
                        </div>
                      </label>
                      {isTrashView && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1"
                          onClick={() => restoreMut.mutate(f.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Восстановить
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex gap-2 justify-center items-center text-sm">
              <Button
                size="sm"
                variant="outline"
                disabled={filePage <= 1}
                onClick={() => setFilePage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <span>
                {meta.current_page} / {meta.last_page}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={filePage >= meta.last_page}
                onClick={() => setFilePage((p) => p + 1)}
              >
                Вперёд
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая папка</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Название</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Например, Акции"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={!newFolderName.trim() || createFolder.isPending}
              onClick={() => createFolder.mutate()}
            >
              {createFolder.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renameTarget} onOpenChange={() => setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать папку</DialogTitle>
          </DialogHeader>
          <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Отмена
            </Button>
            <Button
              disabled={!renameName.trim() || renameFolder.isPending}
              onClick={() => renameFolder.mutate()}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переместить в папку</DialogTitle>
          </DialogHeader>
          <select
            className="w-full border rounded-md h-10 px-3 bg-background"
            value={moveTargetId}
            onChange={(e) => setMoveTargetId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">— выберите папку —</option>
            {allFolders
              .filter((x) => x.slug !== "__trash__")
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} (id {f.id})
                </option>
              ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={moveTargetId === "" || moveMut.isPending}
              onClick={() => moveMut.mutate()}
            >
              Переместить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
