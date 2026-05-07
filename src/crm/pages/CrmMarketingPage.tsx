import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  crmMarketingChannelsApi,
  crmMarketingCampaignsApi,
  type CrmMarketingChannel,
  type CrmMarketingCampaignRow,
} from "@/lib/api";
import { fmt } from "../mock/helpers";
import { Plus, Send, Wifi, WifiOff, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function CrmMarketingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [docChannel, setDocChannel] = useState<CrmMarketingChannel | null>(null);

  const [campaignName, setCampaignName] = useState("");
  const [campaignAudience, setCampaignAudience] = useState<string>("all");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");

  const channelsQuery = useQuery({
    queryKey: ["crm-marketing-channels"],
    queryFn: () => crmMarketingChannelsApi.list().then((r) => r.data),
  });

  const campaignsQuery = useQuery({
    queryKey: ["crm-marketing-campaigns"],
    queryFn: () => crmMarketingCampaignsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      crmMarketingCampaignsApi.create({
        name: campaignName.trim(),
        channel_key: "email",
        audience: campaignAudience,
        subject: campaignSubject.trim() || undefined,
        body_html: campaignBody.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success("Черновик рассылки сохранён");
      setCreateOpen(false);
      setCampaignName("");
      setCampaignSubject("");
      setCampaignBody("");
      qc.invalidateQueries({ queryKey: ["crm-marketing-campaigns"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось создать кампанию"),
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, limit }: { id: number; limit?: number }) =>
      crmMarketingCampaignsApi.send(id, limit ? { limit } : undefined),
    onSuccess: (r) => {
      toast.success(r.message);
      qc.invalidateQueries({ queryKey: ["crm-marketing-campaigns"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не удалось отправить"),
  });

  const campaigns = campaignsQuery.data ?? [];
  const channels = channelsQuery.data ?? [];

  const campaignCols: Column<CrmMarketingCampaignRow>[] = [
    {
      key: "name",
      title: "Кампания",
      render: (c) => (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sm">{c.name}</span>
          {c.status === "draft" ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-7 w-fit gap-1 text-xs"
              disabled={sendMutation.isPending || !connectedEmail}
              title={
                connectedEmail ? undefined : "Включите и настройте SMTP в интеграциях перед отправкой"
              }
              onClick={() => sendMutation.mutate({ id: c.id, limit: 200 })}
            >
              <Send className="h-3 w-3" /> Разослать (до 200)
            </Button>
          ) : null}
        </div>
      ),
    },
    { key: "channel", title: "Канал" },
    {
      key: "audience",
      title: "Аудитория",
      render: (c) => (
        <span className="text-xs capitalize">
          {c.audience === "all" ? "Все" : c.audience === "new" ? "Новые" : c.audience === "vip" ? "VIP" : "Неактивные"}
        </span>
      ),
    },
    {
      key: "status",
      title: "Статус",
      render: (c) => <StatusBadge status={c.status as "draft" | "sent" | "scheduled" | "sending"} />,
    },
    { key: "sentCount", title: "Отправлено", render: (c) => fmt(c.sentCount), className: "hidden md:table-cell" },
    {
      key: "openRate",
      title: "Open Rate",
      render: (c) => (c.status === "sent" && c.openRate > 0 ? `${c.openRate}%` : "—"),
      className: "hidden lg:table-cell",
    },
    {
      key: "clickRate",
      title: "CTR",
      render: (c) => (c.status === "sent" && c.clickRate > 0 ? `${c.clickRate}%` : "—"),
      className: "hidden lg:table-cell",
    },
    { key: "scheduledAt", title: "Дата / план" },
  ];

  const connectedEmail = channels.find((ch) => ch.key === "email")?.connected ?? false;

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader
        title="Маркетинг и рассылки"
        description="Каналы и кампании: данные из БД CRM (SMTP, аудитория с маркетинг-согласием)"
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Новая рассылка
          </Button>
        }
      />

      {!connectedEmail ? (
        <p className="text-xs text-muted-foreground">
          Черновики кампаний можно сохранять сразу. Отправка писем возможна после настройки SMTP:{" "}
          <button type="button" className="text-primary underline" onClick={() => navigate("/crm/integrations/mail/smtp")}>
            открыть SMTP
          </button>
          .
        </p>
      ) : null}

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Кампании</TabsTrigger>
          <TabsTrigger value="channels">Каналы</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-4">
          {campaignsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка кампаний…</p>
          ) : campaignsQuery.isError ? (
            <p className="text-sm text-destructive">Не удалось загрузить кампании</p>
          ) : (
            <DataTable data={campaigns} columns={campaignCols} />
          )}
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          {channelsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Загрузка каналов…</p>
          ) : channelsQuery.isError ? (
            <p className="text-sm text-destructive">Не удалось загрузить каналы</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {channels.map((ch) => (
                <div key={ch.key} className="p-4 rounded-lg border border-border bg-card flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl shrink-0">{ch.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{ch.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ch.key === "email"
                          ? ch.connected
                            ? `${fmt(ch.subscriber_count)} согласившихся на маркетинг (email в профиле)`
                            : "SMTP не подключён"
                          : ch.connected
                            ? `${fmt(ch.subscriber_count)} подписчиков (учёт аудитории — следующий этап)`
                            : `Ключи: Интеграции → Маркетинговые каналы → ${ch.name}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2">
                      {ch.connected ? <Wifi className="h-4 w-4 text-primary" /> : <WifiOff className="h-4 w-4 text-muted-foreground" />}
                      {(["email", "telegram", "whatsapp", "vk"] as string[]).includes(ch.key) ? (
                        <Button size="sm" variant={ch.connected ? "outline" : "default"} className="text-xs" asChild>
                          <Link to={`/crm/integrations/mail/${ch.key === "email" ? "smtp" : ch.key}`}>
                            {ch.key === "email" ? (ch.connected ? "Настроить SMTP" : "Подключить SMTP") : ch.connected ? "Настройки" : "Подключить"}
                          </Link>
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs gap-1 h-8 text-muted-foreground"
                        type="button"
                        onClick={() => {
                          setDocChannel(ch);
                          setDocsOpen(true);
                        }}
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Как подключить
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={docsOpen} onOpenChange={(o) => { setDocsOpen(o); if (!o) setDocChannel(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{docChannel?.documentation_title ?? "Инструкция"}</DialogTitle>
            <DialogDescription>{docChannel?.name}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground">{docChannel?.documentation_markdown ?? ""}</pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Новая рассылка</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Название кампании</Label>
              <Input className="h-8 text-sm mt-1" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Канал</Label>
              <Select value="email" disabled>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="email">📧 Email</SelectItem></SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">Другие каналы — см. вкладку «Каналы».</p>
            </div>
            <div>
              <Label className="text-xs">Аудитория</Label>
              <Select value={campaignAudience} onValueChange={setCampaignAudience}>
                <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Выберите..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Согласие на маркетинг · все</SelectItem>
                  <SelectItem value="new">Новые (регистрация ≤ 14 дней)</SelectItem>
                  <SelectItem value="vip">VIP (пока = все подписавшиеся)</SelectItem>
                  <SelectItem value="inactive">Неактивные (пока = все подписавшиеся)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Тема письма</Label>
              <Input className="h-8 text-sm mt-1" value={campaignSubject} placeholder="Например: {{marketplace_name}} — ваши акции недели" />
            </div>
            <div>
              <Label className="text-xs">HTML содержание</Label>
              <Textarea className="mt-1 text-sm font-mono" rows={5} placeholder="HTML с &#123;&#123;customer_name&#125;&#125;, &#123;&#123;logo_block&#125;&#125;, … " value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Отмена</Button>
              <Button size="sm" disabled={!campaignName.trim() || createMutation.isPending} onClick={() => createMutation.mutate()}>
                Сохранить черновик
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              После сохранения у черновика нажмите «Разослать» в таблице — уходят только заполненные тема и HTML. Часто проще заготовить текст в разделе «Шаблоны».
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
