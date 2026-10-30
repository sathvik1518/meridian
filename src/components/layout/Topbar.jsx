import { Link, useLocation } from "react-router-dom";
import { ClipboardList, Command, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useQueueCount } from "../../store/restockStore";
import { useUiStore } from "../../store/uiStore";
import Button from "../ui/Button";
import UserMenu from "./UserMenu";

const LABELS = { products: "Products", orders: "Orders", restock: "Restock queue", team: "Team" };

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Dashboard", to: "/" }];
  if (parts[0]) crumbs.push({ label: LABELS[parts[0]] || "Not found", to: `/${parts[0]}` });
  if (parts[0] === "products" && parts[1]) crumbs.push({ label: `Product #${parts[1]}`, to: pathname });
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
      <ol className="flex items-center gap-2 text-sm text-ink-2">
        {crumbs.map((c, i) => (
          <li key={c.to} className="flex items-center gap-2">
            {i > 0 && (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            )}
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="font-medium text-ink">
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="hover:text-ink">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default function Topbar() {
  const { isDark, toggle } = useTheme();
  const setPalette = useUiStore((s) => s.setPalette);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  const queueCount = useQueueCount();
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-md sm:px-6 lg:px-10">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileNav(true)} aria-label="Open navigation">
        <Menu className="size-5" />
      </Button>
      <Breadcrumbs />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setPalette(true)}
          className="flex h-10 cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface px-3 text-sm text-ink-3 transition hover:border-line-strong hover:text-ink-2 sm:w-64"
          aria-label="Search and jump to anything (Control K)"
        >
          <Search className="size-4" aria-hidden="true" />
          <span className="hidden flex-1 text-left sm:block">Search or jump to…</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] sm:flex">
            <Command className="size-3" aria-hidden="true" />K
          </kbd>
        </button>

        <Link
          to="/restock"
          aria-label={`Restock queue, ${queueCount} items`}
          className="relative grid size-10 place-items-center rounded-xl text-ink-2 transition hover:bg-surface-2 hover:text-ink"
        >
          <ClipboardList className="size-[19px]" />
          {queueCount > 0 && (
            <span className="num absolute top-1 right-0.5 grid min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-on-accent">
              {queueCount}
            </span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={toggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="size-[19px]" /> : <Moon className="size-[19px]" />}
        </Button>
        <UserMenu />
      </div>
    </div>
  );
}
