import { useDocumentTitle } from "../../hooks/useDocumentTitle";

// Every page starts with this: sets the browser tab title and the single <h1>.
export default function PageHeader({ title, description, eyebrow, actions, documentTitle, compact = false }) {
  useDocumentTitle(documentTitle || title);
  return (
    <header className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${compact ? "mb-3" : "mb-6 lg:mb-8"}`}>
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-[0.14em] text-accent-ink uppercase">{eyebrow}</p>}
        <h1 className="font-display text-[1.75rem] leading-[1.1] font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
