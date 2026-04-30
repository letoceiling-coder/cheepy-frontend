import { Link, useParams, Navigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../components/StatusBadge";
import { ArrowLeft } from "lucide-react";

type Category = "crm" | "erp";

const CATALOG: Record<
  Category,
  Record<string, { title: string; icon: string; description: string }>
> = {
  crm: {
    bitrix24: {
      title: "Bitrix24",
      icon: "🔷",
      description: "CRM и управление продажами. Подключение API и вебхуков настраивается на этой странице после выхода серверной части.",
    },
    hubspot: {
      title: "HubSpot",
      icon: "🟠",
      description: "Marketing & Sales CRM. Интеграция в разработке.",
    },
  },
  erp: {
    "1c": {
      title: "1С",
      icon: "🟡",
      description: "Учёт и склад. Обмен заказами и номенклатурой — после реализации коннектора на сервере.",
    },
    sap: {
      title: "SAP",
      icon: "🔵",
      description: "Корпоративная ERP. Интеграция в разработке.",
    },
  },
};

interface Props {
  category: Category;
}

export default function CrmGenericIntegrationPage({ category }: Props) {
  const { slug } = useParams<{ slug: string }>();
  const meta = slug ? CATALOG[category][slug] : undefined;

  if (!slug || !meta) {
    return <Navigate to="/crm/integrations" replace />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`${meta.icon} ${meta.title}`} description={meta.description}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/crm/integrations">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Link>
          </Button>
        }
      />

      <section className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-medium">Статус</h2>
        <div className="flex items-center gap-2">
          <StatusBadge status="disconnected" />
          <span className="text-sm text-muted-foreground">Серверная интеграция не подключена</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xl">
          Поля настроек и проверка подключения появятся здесь после добавления соответствующих endpoints в API (по аналогии с оплатами и СДЭК).
        </p>
      </section>
    </div>
  );
}
