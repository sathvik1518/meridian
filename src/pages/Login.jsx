import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Form, Formik } from "formik";
import { ArrowRight, Boxes, Lock, Mail, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { loginSchema } from "../validation/productSchema";
import { cn } from "../lib/cn";
import Button from "../components/ui/Button";
import { PasswordField, TextField } from "../components/ui/fields";
import Logo from "../components/layout/Logo";
import Toaster from "../components/ui/Toaster";

// The two demo accounts are created by the server's seed data. (These passwords are public on purpose:
// it's a demo. A real app would never ship passwords in the front end.)
const DEMO_ACCOUNTS = [
  { id: "admin", role: "admin", email: "admin@meridian.dev", password: "admin123" },
  { id: "viewer", role: "viewer", email: "viewer@meridian.dev", password: "viewer123" },
];

// Decorative preview of the product (no real numbers, it is only art).
function PreviewArt() {
  const bars = [38, 62, 48, 84, 58, 92, 70];
  const card = "rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm";
  return (
    <div aria-hidden="true" className="mt-12 grid max-w-[34rem] grid-cols-[1.15fr_1fr] gap-4">
      <div className="space-y-4">
        <div className={`animate-float ${card}`}>
          <p className="text-xs tracking-wide text-white/60">Inventory value by category</p>
          <div className="mt-4 space-y-3">
            {[88, 64, 47, 31].map((w, i) => (
              <div key={w} className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="origin-left-grow h-full rounded-full"
                  style={{ width: `${w}%`, background: i === 0 ? "#ff7a3d" : "#4fd1a1", animationDelay: `${0.4 + i * 0.12}s` }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={`animate-float ${card}`} style={{ animationDelay: "-3s" }}>
          <p className="text-xs tracking-wide text-white/60">Revenue, last 30 days</p>
          <div className="mt-4 flex h-16 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="origin-bottom-grow flex-1 rounded-t bg-[#4fd1a1]/80"
                style={{ height: `${h}%`, animationDelay: `${0.6 + i * 0.07}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`animate-float mt-10 self-start bg-white/[0.08] ${card}`} style={{ animationDelay: "-1.5s" }}>
        <p className="text-xs tracking-wide text-white/60">Stock health</p>
        <svg viewBox="0 0 64 64" className="mx-auto mt-4 size-24 -rotate-90">
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgb(255 255 255 / .12)" strokeWidth="9" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#4fd1a1" strokeWidth="9" strokeDasharray="120 200" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#f2b84b" strokeWidth="9" strokeDasharray="26 200" strokeDashoffset="-124" />
          <circle cx="32" cy="32" r="26" fill="none" stroke="#ff7468" strokeWidth="9" strokeDasharray="10 200" strokeDashoffset="-154" />
        </svg>
        <ul className="mt-4 space-y-1.5 text-xs text-white/70">
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#4fd1a1]" />
            Healthy
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#f2b84b]" />
            Running low
          </li>
          <li className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#ff7468]" />
            Out of stock
          </li>
        </ul>
      </div>
    </div>
  );
}

export default function Login() {
  useDocumentTitle("Sign in");
  const { isAuthenticated, login } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null); // "form" | "admin" | "viewer" | null
  const [shakeKey, setShakeKey] = useState(0);
  // Where did the visitor originally want to go? (RequireAuth saved it for us.)
  const from = location.state?.from;
  const target = from ? `${from.pathname}${from.search || ""}` : "/";
  if (isAuthenticated) return <Navigate to={target} replace />;
  async function attempt(values, source) {
    setError("");
    setBusy(source);
    try {
      await login(values); // success flips isAuthenticated, and the <Navigate> above takes over
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed. Please try again.");
      setShakeKey((k) => k + 1);
      setBusy(null);
    }
  }
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.08fr_1fr]">
      {/* Brand panel */}
      <section className="grain grid-lines relative hidden overflow-hidden bg-[#10231c] p-12 text-white lg:flex lg:flex-col xl:p-16">
        <div
          className="pointer-events-none absolute -top-40 -right-40 size-[28rem] rounded-full bg-[#ff7a3d]/15 blur-3xl"
          aria-hidden="true"
        />
        <Logo className="relative text-white" />
        <div className="relative mt-auto mb-auto max-w-xl pt-16">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/70">
            <span className="size-1.5 rounded-full bg-[#4fd1a1]" /> Retail operations console
          </p>
          <h1 className="font-display text-5xl leading-[1.04] font-semibold tracking-tight xl:text-6xl">
            Run the whole floor from <span className="text-[#ff7a3d]">one screen.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-white/65">
            Live inventory, orders and restock planning, with role-based access for every person on your team.
          </p>
          <PreviewArt />
        </div>
        <p className="relative text-sm text-white/45">React · Router · Express · PostgreSQL · Vercel</p>
      </section>

      {/* Form panel */}
      <section className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Logo className="lg:invisible" />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          <h2 className="font-display text-4xl leading-tight font-semibold tracking-tight">Welcome back</h2>
          <p className="mt-2 text-ink-2">Sign in to your workspace to continue.</p>

          {from && (
            <p className="mt-5 flex items-center gap-2 rounded-xl bg-info-soft px-4 py-3 text-sm text-info-ink" role="status">
              <Lock className="size-4 shrink-0" aria-hidden="true" /> Sign in to open <span className="font-medium">{from.pathname}</span>
            </p>
          )}

          <div className="mt-7">
            <p className="mb-2.5 text-xs font-semibold tracking-[0.12em] text-ink-3 uppercase">One-click demo</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {DEMO_ACCOUNTS.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={() => attempt({ email: u.email, password: u.password, remember: false }, u.id)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-surface p-3.5 text-left transition",
                    "hover:border-accent hover:shadow-[0_0_0_4px_rgb(201_74_18/0.08)] disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-lg",
                      u.role === "admin" ? "bg-accent-soft text-accent-ink" : "bg-info-soft text-info-ink",
                    )}
                  >
                    {busy === u.id ? (
                      <span className="animate-spin-slow size-4 rounded-full border-2 border-current border-t-transparent" />
                    ) : u.role === "admin" ? (
                      <ShieldCheck className="size-5" />
                    ) : (
                      <UserRound className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{u.role === "admin" ? "Admin" : "Viewer"}</span>
                    <span className="block truncate text-xs text-ink-2">{u.role === "admin" ? "Full access" : "Read only"}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-ink-3" aria-hidden="true">
            <span className="h-px flex-1 bg-line" /> or use your email <span className="h-px flex-1 bg-line" />
          </div>

          <Formik
            initialValues={{ email: "", password: "", remember: true }}
            validationSchema={loginSchema}
            onSubmit={(v) => attempt(v, "form")}
          >
            {({ values, handleChange }) => (
              <Form noValidate key={shakeKey} className={cn("space-y-4", shakeKey > 0 && "animate-shake")}>
                <TextField name="email" type="email" label="Email" placeholder="admin@meridian.dev" icon={Mail} autoComplete="username" />
                <PasswordField name="password" label="Password" placeholder="••••••••" />
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-2">
                  <input
                    type="checkbox"
                    name="remember"
                    checked={values.remember}
                    onChange={handleChange}
                    className="size-4 cursor-pointer rounded accent-[var(--accent)]"
                  />
                  Keep me signed in on this device
                </label>

                {error && (
                  <p role="alert" className="rounded-xl bg-bad-soft px-4 py-3 text-sm font-medium text-bad-ink">
                    {error}
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full" loading={busy === "form"} disabled={Boolean(busy)}>
                  Sign in <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Form>
            )}
          </Formik>

          <p className="mt-6 flex items-start gap-2 text-xs text-ink-3">
            <Boxes className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Demo workspace with sample data. Sessions use a secure httpOnly cookie issued by the API.
          </p>
        </div>
      </section>
      <Toaster />
    </div>
  );
}
