import {
  LayoutDashboard, Package, FolderTree, ShoppingCart, Users, Store,
  BarChart3, Megaphone, MessageSquare, Settings, ArrowLeft, Layers,
  Shield, Truck, CreditCard, Wallet, MapPin, Ticket, Mail, FileText,
  Bell, PackageCheck, Plug, Building2, Link2, KeyRound, Activity, Images,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { useRbac } from "../rbac/RbacContext";
import { Permission } from "../rbac/types";

interface NavItem {
  title: string;
  url: string;
  icon: any;
  end?: boolean;
  permission?: Permission | Permission[];
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    label: "Основное",
    items: [
      { title: "Dashboard", url: "/crm", icon: LayoutDashboard, end: true },
      { title: "Контент", url: "/crm/content", icon: Layers, permission: "content.manage" },
      { title: "Уведомления", url: "/crm/notifications", icon: Bell },
    ],
  },
  {
    label: "Каталог",
    items: [
      { title: "Товары", url: "/crm/products", icon: Package, permission: "products.read" },
      { title: "Категории", url: "/crm/categories", icon: FolderTree, permission: "products.read" },
      {
        title: "Маппинг категорий",
        url: "/crm/catalog/mapping",
        icon: Link2,
        permission: "products.read",
      },
      { title: "Медиабиблиотека", url: "/crm/media", icon: Images, permission: "products.read" },
      { title: "Модерация", url: "/crm/moderation", icon: Shield, permission: "moderation.read" },
    ],
  },
  {
    label: "Продажи",
    items: [
      { title: "Заказы", url: "/crm/orders", icon: ShoppingCart, permission: "orders.read" },
      { title: "Fulfillment", url: "/crm/fulfillment", icon: PackageCheck, permission: "orders.read" },
      { title: "Доставка", url: "/crm/delivery", icon: Truck, permission: "delivery.manage" },
      { title: "Регионы", url: "/crm/regions", icon: MapPin, permission: "delivery.manage" },
    ],
  },
  {
    label: "Финансы",
    items: [
      { title: "Платежи", url: "/crm/payments", icon: CreditCard, permission: "finance.view" },
      { title: "Выплаты", url: "/crm/payouts", icon: Wallet, permission: "finance.payout" },
    ],
  },
  {
    label: "Маркетинг",
    items: [
      { title: "Акции", url: "/crm/promotions", icon: Megaphone, permission: "marketing.create" },
      { title: "Промокоды", url: "/crm/coupons", icon: Ticket, permission: "marketing.create" },
      { title: "Рассылки", url: "/crm/marketing", icon: Mail, permission: "marketing.send" },
      { title: "Шаблоны", url: "/crm/templates", icon: FileText, permission: "content.manage" },
    ],
  },
  {
    label: "Пользователи",
    items: [
      { title: "Пользователи", url: "/crm/users", icon: Users, permission: "users.manage" },
      { title: "Продавцы", url: "/crm/sellers", icon: Store, permission: "sellers.manage" },
      { title: "Отзывы", url: "/crm/reviews", icon: MessageSquare, permission: "reviews.manage" },
    ],
  },
  {
    label: "Система",
    items: [
      { title: "Аналитика", url: "/crm/analytics", icon: BarChart3, permission: "analytics.view" },
      { title: "Маркетплейсы", url: "/crm/tenants", icon: Building2, permission: "tenants.manage" },
      { title: "Интеграции", url: "/crm/integrations", icon: Plug, permission: "integrations.manage" },
      { title: "Webhook Logs", url: "/crm/webhook-logs", icon: Activity, permission: "integrations.manage" },
      { title: "API Keys", url: "/crm/api-keys", icon: KeyRound, permission: "integrations.manage" },
      { title: "Настройки", url: "/crm/settings", icon: Settings, permission: "settings.manage" },
    ],
  },
];

export function CrmSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { hasPermission, hasAnyPermission } = useRbac();

  const isItemVisible = (item: NavItem) => {
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) return hasAnyPermission(...item.permission);
    return hasPermission(item.permission);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between px-3 py-2">
            {!collapsed && (
              <span className="text-sm font-semibold tracking-tight text-foreground">CRM</span>
            )}
            {!collapsed && (
              <Link
                to="/"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                На сайт
              </Link>
            )}
          </SidebarGroupLabel>
        </SidebarGroup>

        {sections.map((section) => {
          const visibleItems = section.items.filter(isItemVisible);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label}>
              {!collapsed && (
                <SidebarGroupLabel className="px-3 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                  {section.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={'end' in item ? item.end : false}
                          className="hover:bg-accent/10 transition-colors"
                          activeClassName="bg-accent/15 text-primary font-medium"
                        >
                          <item.icon className="h-4 w-4 mr-2 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
