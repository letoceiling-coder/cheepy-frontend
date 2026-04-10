import { Link, Navigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

/**
 * Карточка каталога CRM редактируется в «Модерации» (system_products).
 * Старый макет на mock-данных отключён — перенаправляем на реальный экран.
 */
export default function CrmProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Не указан товар</h2>
          <Link to="/crm/products" className="text-sm text-primary hover:underline">
            ← Вернуться к товарам
          </Link>
        </div>
      </div>
    );
  }

  if (id === "new") {
    return <Navigate to="/crm/moderation" replace />;
  }

  if (!/^\d+$/.test(id)) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Товар не найден</h2>
          <Button variant="link" asChild>
            <Link to="/crm/products">← Вернуться к товарам</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Navigate to={`/crm/moderation/${id}`} replace />;
}
