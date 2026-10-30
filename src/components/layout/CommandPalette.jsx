import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CornerDownLeft,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Sun,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useDebounce } from "../../hooks/useDebounce";
import { useHotkey } from "../../hooks/useHotkey";
import { useProductSuggest } from "../../hooks/queries";
import { useUiStore } from "../../store/uiStore";
import { money } from "../../lib/format";
import { cn } from "../../lib/cn";
import Overlay from "../ui/Overlay";
import ProductThumb from "../ui/ProductThumb";
import Spinner from "../ui/Spinner";

// Press Ctrl/Cmd + K anywhere. Type to jump to a page, run an action, or find a product.
export default function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPalette);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isDark, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef(null);
  const debounced = useDebounce(query, 250);
  const search = useProductSuggest(debounced);
  useHotkey("mod+k", () => setOpen(!useUiStore.getState().paletteOpen));
  const close = () => {
    setOpen(false);
    setQuery("");
    setCursor(0);
  };
  const go = (to) => () => {
    close();
    navigate(to);
  };
  const items = useMemo(() => {
    const pages = [
      { id: "p-dash", group: "Go to", label: "Dashboard", icon: LayoutDashboard, run: go("/") },
      { id: "p-prod", group: "Go to", label: "Products", icon: Package, run: go("/products") },
      { id: "p-ord", group: "Go to", label: "Orders", icon: ShoppingCart, run: go("/orders") },
      { id: "p-rest", group: "Go to", label: "Restock queue", icon: ClipboardList, run: go("/restock") },
      ...(user?.role === "admin" ? [{ id: "p-team", group: "Go to", label: "Team", icon: Users, run: go("/team") }] : []),
    ];
    const actions = [
      ...(user?.role === "admin" ? [{ id: "a-new", group: "Actions", label: "New product", icon: Plus, run: go("/products?new=1") }] : []),
      {
        id: "a-theme",
        group: "Actions",
        label: isDark ? "Switch to light mode" : "Switch to dark mode",
        icon: isDark ? Sun : Moon,
        run: () => {
          toggle();
          close();
        },
      },
      {
        id: "a-out",
        group: "Actions",
        label: "Sign out",
        icon: LogOut,
        run: () => {
          close();
          void logout();
        },
      },
    ];
    const needle = query.trim().toLowerCase();
    const filtered = [...pages, ...actions].filter((i) => !needle || i.label.toLowerCase().includes(needle));
    const products = (needle.length >= 2 ? search.data || [] : []).map((p) => ({
      id: `prod-${p.id}`,
      group: "Products",
      label: p.title,
      meta: money(p.price),
      product: p,
      run: go(`/products/${p.id}`),
    }));
    return [...products, ...filtered];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, search.data, user?.role, isDark]);
  useEffect(() => setCursor(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(items.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[cursor]?.run();
    }
  };
  let lastGroup = "";
  return (
    <Overlay open={open} onClose={close} label="Command palette" placement="top" className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-[18px] text-ink-3" aria-hidden="true" />
        <input
          data-autofocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[cursor] ? `palette-${items[cursor].id}` : undefined}
          aria-label="Search pages, actions and products"
          placeholder="Search pages, actions and products…"
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-ink-3"
        />
        {search.isFetching && <Spinner className="size-4" />}
        <kbd className="rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-ink-3">esc</kbd>
      </div>

      <ul id="palette-list" role="listbox" aria-label="Results" ref={listRef} className="max-h-[52vh] overflow-y-auto p-2">
        {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-ink-2">Nothing matches “{query}”.</li>}
        {items.map((item, i) => {
          const showGroup = item.group !== lastGroup;
          lastGroup = item.group;
          return (
            <li key={item.id} role="presentation">
              {showGroup && (
                <p className="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.12em] text-ink-3 uppercase">{item.group}</p>
              )}
              <button
                id={`palette-${item.id}`}
                role="option"
                aria-selected={i === cursor}
                data-index={i}
                type="button"
                onMouseMove={() => setCursor(i)}
                onClick={item.run}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                  i === cursor ? "bg-accent-soft text-accent-ink" : "text-ink",
                )}
              >
                {item.product ? (
                  <ProductThumb src={item.product.thumbnail} title={item.label} className="size-8" />
                ) : item.icon ? (
                  <item.icon className="size-[18px] shrink-0 opacity-80" aria-hidden="true" />
                ) : null}
                <span className="flex-1 truncate">{item.label}</span>
                {item.meta && <span className="num text-xs opacity-70">{item.meta}</span>}
                {i === cursor && <CornerDownLeft className="size-3.5 opacity-60" aria-hidden="true" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Overlay>
  );
}
