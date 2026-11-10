export function SiteFooter() {
  return (
    <footer className="mt-2 border-t border-border pt-5 text-sm text-muted animate-[rise_0.85s_ease_both]">
      <h2 className="mt-0 mb-2 font-serif text-base font-semibold text-ink">
        Impressum
      </h2>
      <p className="m-0 mb-2">
        This site is a private, non-commercial what-if tool by{" "}
        <strong className="text-ink">Mokhtar Al-Shubei</strong> (author).
      </p>
      <p className="m-0 mb-2">
        Contact:{" "}
        <a
          className="text-accent underline-offset-2 hover:underline"
          href="mailto:alshubei83@gmail.com"
        >
          alshubei83@gmail.com
        </a>
      </p>
      <p className="m-0 mb-2">
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
        Not investment advice. Prices come from third-party market data (Yahoo
        Finance) and may be delayed or incomplete. No brokerage account is
        connected; nothing here places trades.
      </p>
      <p
        className="m-0 mt-3 text-xs font-mono tabular-nums text-muted/80"
        aria-label="Software version"
      >
        Version {__APP_VERSION__}
      </p>
    </footer>
  );
}
