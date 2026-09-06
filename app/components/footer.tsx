// /app/components/footer.tsx
import Link from "next/link";
import { FaEnvelope, FaLock } from "react-icons/fa6";
import {
  DEFAULT_SITE_SETTINGS,
  getOrCreateSiteSettings,
} from "../lib/site-settings.server";

function toTelHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

function LocationCard({
  title,
  address,
  phoneHref,
  phoneLabel,
  mapHref,
}: {
  title: string;
  address: string;
  phoneHref: string;
  phoneLabel: string;
  mapHref?: string;
}) {
  return (
    <div className="h-full rounded-2xl border border-emerald-800/10 dark:border-emerald-300/10 bg-white/70 dark:bg-white/5 p-4 shadow-sm">
      <div className="text-sm opacity-80">Standort</div>
      <h3 className="mt-1 text-base font-semibold">{title}</h3>
      <div className="mt-2 text-sm leading-6">
        {mapHref ? (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block decoration-emerald-600/40
                      hover:text-emerald-700 hover:decoration-emerald-600
                      dark:hover:text-emerald-300 dark:decoration-emerald-300/30 dark:hover:decoration-emerald-300
                      transition-colors"
            aria-label={`Adresse auf Google Maps öffnen: ${title}`}
          >
            <div className="whitespace-pre-line">{address}</div>
          </a>
        ) : (
          <div className="whitespace-pre-line">{address}</div>
        )}
      </div>
      <div className="mt-3 text-sm">
        Telefon:{" "}
        <a href={phoneHref} className="underline underline-offset-2 hover:opacity-80">
          {phoneLabel}
        </a>
      </div>
    </div>
  );
}

export default async function Footer() {
  const year = new Date().getFullYear();
  const site = await getOrCreateSiteSettings().catch(() => ({
    id: "fallback",
    ...DEFAULT_SITE_SETTINGS,
  }));

  return (
    <footer className="mt-16 border-t border-emerald-800/10 dark:border-emerald-300/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur text-zinc-800 dark:text-zinc-200">
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div>
          <h2 className="text-base font-semibold">{site.footerTitle}</h2>
          <p className="mt-1 text-sm opacity-80">
            {site.footerSubtitle}
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-800/10 dark:border-emerald-300/10 bg-white/70 dark:bg-white/5 p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide opacity-70">E-Mail</div>
          <div className="mt-2 flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
              <FaEnvelope className="text-lg" />
            </span>
            <a
              href={`mailto:${site.footerEmail}`}
              className="text-sm font-medium hover:underline"
            >
              {site.footerEmail}
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 items-stretch">
          <LocationCard
            title="Recke"
            address={site.footerAddressRecke}
            phoneHref={toTelHref(site.footerPhoneRecke)}
            phoneLabel={site.footerPhoneRecke}
            mapHref="https://maps.app.goo.gl/v7fAobfiUPDe8xTV6"
          />
          <LocationCard
            title="Mettingen"
            address={site.footerAddressMettingen}
            phoneHref={toTelHref(site.footerPhoneMettingen)}
            phoneLabel={site.footerPhoneMettingen}
            mapHref="https://maps.app.goo.gl/gyHqK9nJXGHv4oxX6"
          />
        </div>
      </div>

      <div className="border-t border-emerald-800/10 dark:border-emerald-300/10">
        <div className="mx-auto w-full max-w-5xl px-4 py-3 text-xs flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between opacity-80">
          <div>© {year} Backschmiede Kölker</div>
          <div className="flex items-center gap-4">
            <a href="/imprint" className="hover:opacity-80">Impressum</a>
            <a href="/privacy" className="hover:opacity-80">Datenschutz</a>

            <Link
              href="/admin"
              prefetch={false}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 ring-1 ring-emerald-800/10 dark:ring-emerald-300/10 bg-white/40 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition opacity-60 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
              aria-label="Adminbereich"
              rel="nofollow"
            >
              <FaLock aria-hidden className="text-[11px]" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
