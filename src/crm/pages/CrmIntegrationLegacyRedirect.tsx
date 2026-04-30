import { Navigate, useParams } from "react-router-dom";

const PAYMENT_NAMES = new Set(["tinkoff", "sber", "atol", "stripe"]);

/** Старые ссылки /crm/integrations/:provider → /crm/integrations/payments/:provider */
export default function CrmIntegrationLegacyRedirect() {
  const { provider } = useParams<{ provider: string }>();
  if (provider && PAYMENT_NAMES.has(provider)) {
    return <Navigate to={`/crm/integrations/payments/${provider}`} replace />;
  }
  return <Navigate to="/crm/integrations" replace />;
}
