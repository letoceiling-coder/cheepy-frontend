import {
  LayoutDashboard, Bug, Package, FolderTree, Brain, Clock, FileText, Settings, Ban, ShieldCheck, ArrowLeft, Tag, SlidersHorizontal, Users, Store, BookOpen,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, Link } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Парсер", url: "/admin/parser", icon: Bug },
  { title: "Объявления", url: "/admin/products", icon: Package },
  { title: "Категории", url: "/admin/categories", icon: FolderTree },
  { title: "Продавцы", url: "/admin/sellers", icon: Store },
  { title: "Бренды", url: "/admin/brands", icon: Tag },
  { title: "Фильтры", url: "/admin/filters", icon: SlidersHorizontal },
  { title: "Атрибуты / Правила", url: "/admin/attribute-rules", icon: Wand2 },
  { title: "AI Модуль", url: "/admin/ai", icon: Brain },
  { title: "Планировщик", url: "/admin/scheduler", icon: Clock },
  { title: "Исключения", url: "/admin/excluded", icon: Ban },
  { title: "Логи", url: "/admin/logs", icon: FileText },
  { title: "Документация", url: "/admin/docs", icon: BookOpen },
  { title: "Пользователи", url: "/admin/users", icon: Users },
  { title: "Роли", url: "/admin/roles", icon: ShieldCheck },
  { title: "Настройки", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            {!collapsed && (
              <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-3 w-3" />
                На сайт
              </Link>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-accent/50"
                      activeClassName="bg-accent text-accent-foreground font-medium"
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
      </SidebarContent>
    </Sidebar>
  );
}
