import { useState } from "react";
import {
  Archive,
  File,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Image as ImageIcon,
  Presentation,
} from "lucide-react";
import { resolveCrmMediaAssetUrl, type CrmMediaFile } from "@/lib/api";

const IMAGE_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "ico",
  "avif",
  "heic",
  "tif",
  "tiff",
]);

const VIDEO_EXT = new Set(["mp4", "webm", "mkv", "mov", "avi", "m4v", "ogv"]);

function extFromName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() || fileName;
  const i = base.lastIndexOf(".");
  if (i <= 0 || i === base.length - 1) return "";
  return base.slice(i + 1).toLowerCase();
}

/** MIME или расширение: бэкенд иногда отдаёт application/octet-stream вместо image/jpeg. */
function isRenderableAsImage(
  mime: string | null,
  fileName: string,
  storageUrl?: string | null
): boolean {
  const m = (mime || "").toLowerCase();
  if (m.startsWith("video/")) return false;
  const ext = extFromName(fileName);
  if (VIDEO_EXT.has(ext)) return false;
  if (m.startsWith("image/")) return true;
  if (IMAGE_EXT.has(ext)) return true;
  if (storageUrl) {
    const path = storageUrl.split("?")[0].split("#")[0];
    const fromUrl = extFromName(path);
    if (VIDEO_EXT.has(fromUrl)) return false;
    if (IMAGE_EXT.has(fromUrl)) return true;
  }
  return false;
}

function pickFileIcon(mime: string | null, fileName: string) {
  const m = (mime || "").toLowerCase();
  const ext = extFromName(fileName);

  if (m.startsWith("video/") || ["mp4", "webm", "mkv", "mov", "avi"].includes(ext)) {
    return FileVideo;
  }
  if (m.startsWith("audio/") || ["mp3", "wav", "flac", "ogg", "m4a", "aac"].includes(ext)) {
    return FileAudio;
  }
  if (m === "application/pdf" || ext === "pdf") return FileText;
  if (
    m.includes("zip") ||
    m.includes("rar") ||
    m.includes("compressed") ||
    ["zip", "rar", "7z", "gz", "tar", "bz2", "xz"].includes(ext)
  ) {
    return Archive;
  }
  if (
    ["csv", "xls", "xlsx", "ods"].includes(ext) ||
    m.includes("spreadsheet") ||
    m.includes("csv")
  ) {
    return FileSpreadsheet;
  }
  if (["ppt", "pptx", "odp"].includes(ext) || m.includes("presentation")) {
    return Presentation;
  }
  if (
    ["html", "htm", "xml", "json", "js", "ts", "tsx", "css", "md", "yml", "yaml"].includes(ext) ||
    m.startsWith("text/")
  ) {
    return FileCode;
  }
  return File;
}

type Props = {
  file: CrmMediaFile;
  className?: string;
};

/** Превью: картинки с URL бэкенда; остальное — иконка по типу; битая картинка — запасная иконка. */
export function CrmMediaFilePreview({ file, className }: Props) {
  const [imgBroken, setImgBroken] = useState(false);
  const url = resolveCrmMediaAssetUrl(file.url);
  const treatAsImage = isRenderableAsImage(file.mime_type, file.original_name, file.url);
  const showImg = Boolean(treatAsImage && url && !imgBroken);
  const Icon = pickFileIcon(file.mime_type, file.original_name);

  return (
    <div
      className={
        className ??
        "flex h-full w-full min-h-0 items-center justify-center overflow-hidden bg-muted"
      }
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
          {imgBroken && treatAsImage ? (
            <ImageIcon className="h-10 w-10 shrink-0 opacity-70" aria-hidden />
          ) : (
            <Icon className="h-10 w-10 shrink-0" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
