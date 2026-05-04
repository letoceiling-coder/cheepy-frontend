import { type ReactNode } from "react";
import SystemAuthGuard from "@/admin/components/SystemAuthGuard";

/**
 * CRM is a system area. It requires the same admin JWT and admin role as /admin.
 */
export default function CrmAuthGuard({ children }: { children: ReactNode }) {
  return <SystemAuthGuard>{children}</SystemAuthGuard>;
}
