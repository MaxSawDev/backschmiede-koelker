import { Metadata } from "next";
import { JobHero } from "@/app/components/jobs/job-hero";
import { JobFilters } from "@/app/components/jobs/job-filters";
import { JobList } from "@/app/components/jobs/job-list";
import { buildFacetsFromActiveJobs } from "@/app/components/jobs/facets";
import { buildJobsListJsonLd } from "@/app/components/jobs/job-schema";
import { fetchJobs } from "@/app/lib/jobs/db";
import { Suspense } from "react";
import { serializeJsonLd } from "@/app/lib/json-ld";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Stellenangebote | Backschmiede Kölker",
  description: "Jobs in Backstube, Verkauf & mehr - fair, planbar, Teamspirit. Jetzt bewerben!",
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: "Stellenangebote | Backschmiede Kölker",
    description: "Aktuelle Jobs bei der Backschmiede Kölker. Jetzt bewerben!",
    url: "/jobs",
    type: "website",
  },
};

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const q = (sp.q as string) || "";
  const loc = (sp.loc as string) || "";
  const cat = (sp.cat as string) || "";
  const emp = (sp.emp as string) || ""; // "Vollzeit,Teilzeit" labels → wir mappen in db.ts

  const jobs = await fetchJobs({ q, loc, cat, emp });
  const activeAll = await fetchJobs({ activeOnly: true }); // unfiltered facets
  const facets = buildFacetsFromActiveJobs(activeAll);

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-6xl px-3 md:px-4 pt-4">
        <JobHero />

        <div className="mt-4">
          <Suspense fallback={null}>
            <JobFilters facets={facets} />
          </Suspense>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJobsListJsonLd(jobs)) }}
        />

        <JobList jobs={jobs} />
      </div>
    </div>
  );
}
