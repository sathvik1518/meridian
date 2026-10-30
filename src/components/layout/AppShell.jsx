import { Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useUiStore } from "../../store/uiStore";
import Toaster from "../ui/Toaster";
import Overlay from "../ui/Overlay";
import Skeleton from "../ui/Skeleton";
import CommandPalette from "./CommandPalette";
import ErrorBoundary from "./ErrorBoundary";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading page">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

export default function AppShell() {
  const location = useLocation();
  const mainRef = useRef(null);
  const firstRender = useRef(true);
  const [announce, setAnnounce] = useState("");
  const mobileOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNav = useUiStore((s) => s.setMobileNav);
  // After every page change: scroll to top, move keyboard focus to the content,
  // and tell screen readers where they are. (Single-page apps don't do this by default.)
  useEffect(() => {
    setMobileNav(false);
    if (firstRender.current) {
      firstRender.current = false;
      return undefined;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
    const id = setTimeout(() => setAnnounce(`Navigated to ${document.title.replace(" · Meridian", "")}`), 150);
    return () => clearTimeout(id);
  }, [location.pathname, setMobileNav]);
  return (
    <div className="min-h-dvh lg:flex">
      <a
        href="#main"
        className="sr-only-focusable fixed top-3 left-3 z-[70] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 z-40 hidden h-dvh shrink-0 lg:block" aria-label="Sidebar">
        <Sidebar />
      </aside>

      <Overlay open={mobileOpen} onClose={() => setMobileNav(false)} label="Navigation" placement="left" className="overflow-hidden">
        <Sidebar mobile onNavigate={() => setMobileNav(false)} />
      </Overlay>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 outline-none sm:px-6 lg:px-10 lg:py-8"
        >
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<PageSkeleton />}>
              <div key={location.pathname.split("/")[1] || "home"} className="animate-rise">
                <Outlet />
              </div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
      <CommandPalette />
      <Toaster />
    </div>
  );
}
