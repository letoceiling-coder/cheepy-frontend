import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  connected: "bg-green-100 text-green-700 border-green-200",
  disconnected: "bg-muted text-muted-foreground border-border",
  error: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-green-100 text-green-700 border-green-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  published: "bg-green-100 text-green-700 border-green-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-blue-100 text-blue-700 border-blue-200",
  new: "bg-primary/10 text-primary border-primary/20",
  moderation: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-muted text-muted-foreground border-border",
  inactive: "bg-muted text-muted-foreground border-border",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  refunded: "bg-orange-100 text-orange-700 border-orange-200",
  archived: "bg-muted text-muted-foreground border-border",
  ended: "bg-muted text-muted-foreground border-border",
  approved: "bg-green-100 text-green-700 border-green-200",
  needs_review: "bg-amber-100 text-amber-700 border-amber-200",
};

const labels: Record<string, string> = {
  connected: "Подключено",
  disconnected: "Не подключено",
  error: "Ошибка",
  active: "Активен",
  delivered: "Доставлен",
  published: "Опубликован",
  paid: "Оплачен",
  confirmed: "Подтверждён",
  shipped: "Отправлен",
  new: "Новый",
  moderation: "На модерации",
  pending: "Ожидание",
  draft: "Черновик",
  scheduled: "Запланирован",
  inactive: "Неактивен",
  blocked: "Заблокирован",
  cancelled: "Отменён",
  rejected: "Отклонён",
  failed: "Ошибка",
  refunded: "Возврат",
  archived: "Архив",
  ended: "Завершён",
  approved: "Одобрен",
  needs_review: "На проверке",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", variants[status] || "bg-muted text-muted-foreground", className)}
    >
      {labels[status] || status}
    </Badge>
  );
}
