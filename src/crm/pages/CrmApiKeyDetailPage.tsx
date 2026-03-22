import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { crmApi, CrmApiKeyDetail } from "@/lib/api";

export default function CrmApiKeyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<CrmApiKeyDetail | null>(null);
  const [amount, setAmount] = useState("0");
  const [rpm, setRpm] = useState("60");
  const [regenerated, setRegenerated] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    crmApi.apiKeys.get(Number(id)).then((r) => {
      setData(r);
      setRpm(String(r.requests_per_minute));
    });
  };

  useEffect(() => {
    load();
  }, [id]);

  if (!data) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={`API Key #${data.id}`}
        description={data.name}
        actions={<Link to="/crm/api-keys"><Button variant="outline" size="sm">Back</Button></Link>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Balance</div><div className="text-xl font-semibold">{data.balance.toFixed(4)}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Total Requests</div><div className="text-xl font-semibold">{data.total_requests}</div></div>
        <div className="rounded-lg border border-border bg-card p-4"><div className="text-xs text-muted-foreground">Total Cost</div><div className="text-xl font-semibold">{data.total_cost.toFixed(4)}</div></div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-medium">Usage Chart (by day)</h3>
        <div className="space-y-2">
          {data.usage_chart.map((d) => (
            <div key={d.day} className="flex items-center justify-between text-sm border-b border-border pb-1">
              <span>{d.day}</span>
              <span>{d.requests} req</span>
              <span>{d.cost.toFixed(4)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-4">
        <h3 className="text-sm font-medium">Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Add balance</Label>
            <div className="flex gap-2">
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Button size="sm" onClick={async () => { await crmApi.apiKeys.addBalance(data.id, Number(amount)); load(); }}>Add</Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Rate limit (RPM)</Label>
            <div className="flex gap-2">
              <Input value={rpm} onChange={(e) => setRpm(e.target.value)} />
              <Button size="sm" onClick={async () => { await crmApi.apiKeys.update(data.id, { requests_per_minute: Number(rpm) }); load(); }}>Save</Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={async () => { const r = await crmApi.apiKeys.update(data.id, { regenerate: true }); setRegenerated(r.regenerated_key || null); }}>Regenerate key</Button>
          <Button size="sm" variant="outline" onClick={async () => { await crmApi.apiKeys.update(data.id, { is_active: !data.is_active }); load(); }}>
            {data.is_active ? "Disable key" : "Enable key"}
          </Button>
        </div>
        {regenerated && <div className="text-xs font-mono break-all">{regenerated}</div>}
      </div>
    </div>
  );
}
