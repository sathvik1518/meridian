import { useState } from "react";
import { useField } from "formik";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "../../lib/cn";

// Reusable Formik inputs. Each one wires label, error text and ARIA attributes
// so every form in the app behaves (and is announced) the same way.
const control =
  "w-full rounded-xl border bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition outline-none " +
  "focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-60";
function Shell({ id, label, hint, error, children, optional }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-ink-3">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[13px] font-medium text-bad-ink dark:text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function useWiring(name, id) {
  const [field, meta] = useField(name);
  const error = meta.touched && meta.error ? meta.error : "";
  const inputId = id || `field-${name}`;
  return {
    field,
    error,
    inputId,
    aria: { "aria-invalid": Boolean(error), "aria-describedby": error ? `${inputId}-error` : `${inputId}-hint` },
  };
}

export function TextField({ name, label, hint, optional, icon: Icon, suffix, className, ...props }) {
  const { field, error, inputId, aria } = useWiring(name, props.id);
  return (
    <Shell id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />}
        <input
          {...field}
          {...props}
          id={inputId}
          {...aria}
          className={cn(control, "h-11", Icon && "pl-10", suffix && "pr-12", error ? "border-bad" : "border-line-strong", className)}
        />
        {suffix && <span className="absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-ink-3">{suffix}</span>}
      </div>
    </Shell>
  );
}

export function SelectField({ name, label, hint, optional, options, placeholder = "Select…", ...props }) {
  const { field, error, inputId, aria } = useWiring(name, props.id);
  return (
    <Shell id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <select
        {...field}
        {...props}
        id={inputId}
        {...aria}
        className={cn(control, "h-11 cursor-pointer", error ? "border-bad" : "border-line-strong")}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

export function TextAreaField({ name, label, hint, optional, rows = 4, ...props }) {
  const { field, error, inputId, aria } = useWiring(name, props.id);
  return (
    <Shell id={inputId} label={label} hint={hint} error={error} optional={optional}>
      <textarea
        {...field}
        {...props}
        id={inputId}
        rows={rows}
        {...aria}
        className={cn(control, "resize-y py-2.5 leading-relaxed", error ? "border-bad" : "border-line-strong")}
      />
    </Shell>
  );
}

export function PasswordField({ name, label, hint, autoComplete = "current-password", ...props }) {
  const { field, error, inputId, aria } = useWiring(name, props.id);
  const [show, setShow] = useState(false);
  return (
    <Shell id={inputId} label={label} hint={hint} error={error}>
      <div className="relative">
        <input
          {...field}
          {...props}
          id={inputId}
          {...aria}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          className={cn(control, "h-11 pr-12", error ? "border-bad" : "border-line-strong")}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-ink-3 transition hover:bg-surface-2 hover:text-ink"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </Shell>
  );
}
