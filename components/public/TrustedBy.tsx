import { SmartImage } from "@/components/shared/SmartImage";
import { Reveal } from "@/components/public/motion";
import type { SiteData } from "@/lib/services/content";
import { isExternal } from "@/lib/utils";

type Client = SiteData["clients"][number];

function Logo({ client, grayscale }: { client: Client; grayscale: boolean }) {
  const mark = client.logo ? (
    <SmartImage
      src={client.logo.url}
      alt={client.logo.alt || `${client.name} logo`}
      width={client.logo.width ?? 160}
      height={client.logo.height ?? 60}
      sizes="160px"
      className={`max-h-[46px] w-auto max-w-[78%] object-contain transition duration-500 ${grayscale ? "opacity-70 grayscale group-hover:opacity-100 group-hover:grayscale-0" : ""}`}
    />
  ) : (
    <span className="text-lg font-semibold tracking-tight text-muted transition-colors group-hover:text-ink">{client.name}</span>
  );
  const cls = "group flex h-[78px] items-center justify-center bg-panel px-4";
  return client.url && isExternal(client.url) ? (
    <a href={client.url} target="_blank" rel="noopener noreferrer" aria-label={client.name} className={cls}>
      {mark}
    </a>
  ) : (
    <div className={cls}>{mark}</div>
  );
}

const COLS: Record<string, string> = { "3": "lg:grid-cols-3", "4": "lg:grid-cols-4", "5": "lg:grid-cols-5" };

export function TrustedBy({ data }: { data: SiteData }) {
  const cfg = data.sections.clients.content;
  const clients = data.clients;
  if (clients.length === 0) return null;
  const columns = Number(cfg.columns) || 4;
  const filler = (columns - (clients.length % columns)) % columns;

  return (
    <section id="clients" aria-labelledby="clients-heading" className="px-3 sm:px-4">
      <div className="rounded-[28px] bg-soft px-5 py-12 sm:px-10 lg:px-16 lg:py-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 id="clients-heading" className="display text-[40px] lg:text-[48px]">{cfg.heading}</h2>
          {cfg.description && <p className="max-w-md pb-2 text-[13px] text-muted">{cfg.description}</p>}
        </Reveal>

        {cfg.style === "marquee" ? (
          <div className="marquee mt-8 overflow-hidden rounded-xl border border-line bg-panel motion-reduce:overflow-x-auto">
            <ul className="marquee-track flex w-max animate-marquee motion-reduce:animate-none">
              {[...clients, ...clients].map((client, n) => (
                <li key={`${client.id}-${n}`} aria-hidden={n >= clients.length} className="w-[220px] border-r border-line">
                  <Logo client={client} grayscale={cfg.grayscale} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <Reveal delay={0.1}>
            <ul className={`mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3 ${COLS[cfg.columns] ?? COLS["4"]}`}>
              {clients.map((client) => (
                <li key={client.id}>
                  <Logo client={client} grayscale={cfg.grayscale} />
                </li>
              ))}
              {Array.from({ length: filler }, (_, n) => (
                <li key={`filler-${n}`} aria-hidden className="hidden bg-panel lg:block" />
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  );
}
