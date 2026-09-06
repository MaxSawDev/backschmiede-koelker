// /app/layout.tsx
import "./globals.css";

import { Providers } from "./providers/theme-provider";
import LayoutWrapper from "./components/layout-wrapper";
import Footer from "./components/footer";
import { DEFAULT_OG_IMAGE, SITE_URL, localBusinessJsonLd } from "./lib/seo";
import AnalyticsBeacon from "./components/analytics-beacon";
import { serializeJsonLd } from "./lib/json-ld";
import { Suspense } from "react";
import type { Metadata } from "next";

const DEFAULT_TITLE = "Backschmiede Kölker - Handwerk aus Recke & Mettingen";
const DEFAULT_DESCRIPTION =
  "Bäckerei in Recke und Mettingen: Brote, Brötchen und Kuchen mit langer Teigführung, Sauerteig und regionalen Zutaten.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: SITE_URL,
    siteName: DEFAULT_TITLE,
    locale: "de_DE",
    type: "website",
    images: [{ url: DEFAULT_OG_IMAGE, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  icons: {
    icon: [
      { 
        url: "/favicon-light.png" 
      },
      {
        url: "/favicon-dark.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(localBusinessJsonLd()) }}
        />
      </head>
      <body className="bg-white text-black dark:bg-zinc-900 dark:text-white transition-colors duration-300 overflow-x-hidden">
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
          <div className="ml-0 md:ml-72">
            <Footer />
          </div>
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
