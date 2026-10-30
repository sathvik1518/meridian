import { NavLink } from "react-router-dom";
import { ClipboardList, LayoutDashboard, Lock, Package, PanelLeftClose, PanelLeftOpen, ShoppingCart, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useQueueCount } from "../../store/restockStore";
import { useUiStore } from "../../store/uiStore";
import { cn } from "../../lib/cn";
import Avatar from "../ui/Avatar";
import Logo from "./Logo";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
  { to: "/restock", label: "Restock queue", icon: ClipboardList, badge: true },
  { to: "/team", label: "Team", icon: Users, role: "admin" },
];

export default function Sidebar({ mobile = false, onNavigate }) {
  const { user } = useAuth();
  const queueCount = useQueueCount();
  const collapsedPref = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const collapsed = collapsedPref && !mobile;
  return (
    <div
      className={cn("flex h-full flex-col bg-side text-side-ink", collapsed ? "w-[76px]" : "w-[264px]", "transition-[width] duration-200")}
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b border-side-line", collapsed ? "justify-center" : "px-5")}>
        <Logo collapsed={collapsed} />
      </div>

      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && <p className="px-3 pt-3 pb-2 text-[11px] font-semibold tracking-[0.14em] text-side-muted uppercase">Workspace</p>}
        {NAV.map((item) => {
          const locked = item.role && user?.role !== item.role;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl text-sm font-medium transition",
                  collapsed ? "justify-center" : "px-3",
                  isActive ? "bg-side-active text-white" : "text-side-muted hover:bg-side-active/60 hover:text-side-ink",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full bg-[#ff7a3d]" aria-hidden="true" />
                  )}
                  <item.icon className="size-[19px] shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  {!collapsed && item.badge && queueCount > 0 && (
                    <span
                      className="num rounded-full bg-[#ff7a3d] px-2 py-0.5 text-[11px] font-semibold text-[#1b0b03]"
                      aria-label={`${queueCount} items queued`}
                    >
                      {queueCount}
                    </span>
                  )}
                  {!collapsed && locked && <Lock className="size-3.5 opacity-60" aria-label="Admins only" />}
                  {collapsed && item.badge && queueCount > 0 && (
                    <span className="absolute top-2 right-3 size-2 rounded-full bg-[#ff7a3d]" aria-hidden="true" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-side-line p-3">
        <div className={cn("flex items-center gap-3 rounded-xl p-2", collapsed && "justify-center")}>
          <Avatar name={user?.name ?? ""} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-xs text-side-muted">{user?.title}</p>
            </div>
          )}
        </div>
        {!mobile && (
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "flex h-9 w-full cursor-pointer items-center gap-3 rounded-xl text-sm text-side-muted transition hover:bg-side-active/60 hover:text-side-ink",
              collapsed ? "justify-center" : "px-3",
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            {!collapsed && "Collapse"}
          </button>
        )}
      </div>
    </div>
  );
}
