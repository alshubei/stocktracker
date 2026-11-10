import { useId, useState } from "react";
import { InfoIcon } from "./InfoIcon.tsx";

const IMPRESSUM_HINT =
  "Private non-commercial what-if tool by Mokhtar Al-Shubei. Contact and source links, plus a short data disclaimer.";

export function SiteFooter() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <footer className="mt-2 border-t border-border pt-5 text-sm text-muted animate-[rise_0.85s_ease_both]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="m-0 font-serif text-base font-semibold text-ink">
            Impressum
          </h2>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-bg0 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            <InfoIcon className="size-4" />
            <span className="sr-only">
              {open ? "Hide impressum details" : "Show impressum details"}
            </span>
          </button>
        </div>
        <p
          className="m-0 text-xs font-mono tabular-nums text-muted/80"
          aria-label="Software version"
        >
          Version {__APP_VERSION__}
        </p>
      </div>

      <p className="sr-only">{IMPRESSUM_HINT}</p>

      <div
        id={panelId}
        aria-hidden={!open}
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-2 pt-3">
            <p className="m-0">
              This site is a private, non-commercial what-if tool by{" "}
              <strong className="text-ink">Mokhtar Al-Shubei</strong> (author).
            </p>
            <p className="m-0">
              Contact:{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="mailto:alshubei83@gmail.com"
              >
                alshubei83@gmail.com
              </a>
            </p>
            <p className="m-0">
              Source:{" "}
              <a
                className="text-accent underline-offset-2 hover:underline"
                href="https://github.com/alshubei/stocktracker"
                target="_blank"
                rel="noreferrer"
              >
                github.com/alshubei/stocktracker
              </a>
            </p>
            <p className="m-0 text-xs leading-snug">
              Not investment advice. Prices come from third-party market data
              (Yahoo Finance) and may be delayed or incomplete. No brokerage
              account is connected; nothing here places trades.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
