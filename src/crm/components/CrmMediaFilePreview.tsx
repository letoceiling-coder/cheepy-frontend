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

function pickFileIcon(mime: string | null, fileName: string) {
  const m = (mime || "").toLowerCase();
  const ext = (fileName.split(".").pop() || "").toLowerCase();

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
  const isImageMime = file.mime_type?.startsWith("image/") ?? false;
  const showImg = Boolean(isImageMime && url && !imgBroken);
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
          onError={() => setImgBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-muted-foreground">
          {imgBroken && isImageMime ? (
            <ImageIcon className="h-10 w-10 shrink-0 opacity-70" aria-hidden />
          ) : (
            <Icon className="h-10 w-10 shrink-0" aria-hidden />
          )}
        </div>
      )}
    </div>
  );
}
