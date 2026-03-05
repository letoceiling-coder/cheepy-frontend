import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { productsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const statusOptions = [
  { value: "active", label: "Активен" },
  { value: "hidden", label: "Скрыт" },
  { value: "excluded", label: "Исключён" },
  { value: "error", label: "Ошибка" },
  { value: "pending", label: "Ожидание" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState("general");
  const [status, setStatus] = useState<string>("");

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (product) setStatus(product.status);
  }, [product?.id, product?.status]);

  if (isLoading || !product) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />Назад
        </Link>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Загрузка...</div>
        ) : (
          <p className="text-destructive">Товар не найден</p>
        )}
      </div>
    );
  }

  const currentStatus = status || product.status;
  const handleSave = async () => {
    try {
      await productsApi.update(product.id, { status: currentStatus as typeof product.status });
      toast.success("Сохранено");
    } catch {
      toast.error("Ошибка сохранения");
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h2 className="text-2xl font-bold">{product.title}</h2>
          <Badge variant="outline">{product.external_id}</Badge>
        </div>
        <Button onClick={handleSave}><Save className="h-4 w-4 mr-1" />Сохранить</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="general">Основное</TabsTrigger>
          <TabsTrigger value="attributes">Атрибуты</TabsTrigger>
          <TabsTrigger value="media">Медиа</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Название"><Input value={product.title} readOnly className="bg-muted" /></Field>
              <Field label="Категория"><Input value={product.category?.name ?? "—"} readOnly className="bg-muted" /></Field>
              <Field label="Цена"><Input value={product.price ?? product.price_raw ?? "—"} readOnly className="bg-muted" /></Field>
              <Field label="Продавец"><Input value={product.seller?.name ?? "—"} readOnly className="bg-muted" /></Field>
              <Field label="Статус">
                <Select value={currentStatus} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Бренд"><Input value={product.brand?.name ?? "—"} readOnly className="bg-muted" /></Field>
              <Field label="Источник"><Input value={product.source_url ?? "—"} readOnly className="bg-muted" /></Field>
              <Field label="Дата парсинга"><Input value={product.parsed_at ? new Date(product.parsed_at).toLocaleString("ru") : "—"} readOnly className="bg-muted" /></Field>
              <div className="md:col-span-2">
                <Field label="Описание">
                  <textarea value={product.description ?? ""} readOnly className="flex min-h-[120px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm" />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attributes">
          <Card>
            <CardHeader><CardTitle className="text-lg">Атрибуты</CardTitle></CardHeader>
            <CardContent>
              {(!product.attributes || product.attributes.length === 0) ? (
                <p className="text-muted-foreground text-sm">Нет атрибутов</p>
              ) : (
                <div className="space-y-2">
                  {product.attributes.map((a, i) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">{a.name}:</span>
                      <span>{a.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader><CardTitle className="text-lg">Медиа</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(product.photos ?? []).map((img, i) => (
                  <div key={i} className="aspect-square rounded-lg border bg-muted overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {(!product.photos || product.photos.length === 0) && (
                  <p className="text-muted-foreground text-sm col-span-2">Нет фото</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
