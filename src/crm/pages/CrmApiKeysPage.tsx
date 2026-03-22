import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { DataTable, Column } from "../components/DataTable";
import { StatusBadge } from "../components/StatusBadge";
import { crmApi, CrmApiKeyItem } from "@/lib/api";

export default function CrmApiKeysPage() {
  const [rows, setRows] = useState<CrmApiKeyItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    crmApi.apiKeys.list({ page: 1, per_page: 100 }).then((r) => setRows(r.data || []));
  }, []);

  const columns: Column<CrmApiKeyItem>[] = [
    { key: "name", title: "Key", render: (r) => <span className="font-medium text-sm">{r.name}</span> },
    { key: "balance", title: "Balance", render: (r) => r.balance.toFixed(4) },
    { key: "usage_today", title: "Usage Today", render: (r) => r.usage_today },
    { key: "requests_per_minute", title: "RPM", render: (r) => r.requests_per_minute },
    { key: "status", title: "Status", render: (r) => <StatusBadge status={r.is_active ? "active" : "archived"} /> },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader title="API Keys" description="SaaS access keys" />
      <DataTable data={rows} columns={columns} onRowClick={(r) => navigate(`/crm/api-keys/${r.id}`)} />
    </div>
  );
}
