import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Raleway, Oswald, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/app/providers";
import { AppShell } from "@/components/app/app-shell";
import { Toaster } from "@/components/ui/sonner";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const cloudflareWebAnalyticsToken =
  process.env.NEXT_PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

// Condensed display face for matchday/scoreboard headings.
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["500", "600", "700"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

// URL.canParse: si NEXT_PUBLIC_SITE_URL viene mal escrita, `new URL` tira
// TypeError y revienta el render de todo el layout.
const metadataBase = URL.canParse(siteUrl)
  ? new URL(siteUrl)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: "Reta Fútbol · Manager estilo FIFA para tu reta",
    template: "%s",
  },
  description:
    "Organiza tu reta como un club: crea jugadores con stats FIFA, arma equipos balanceados por overall y posición, lleva el marcador en vivo y guarda el registro de partidos y goleadores.",
  applicationName: "Reta Fútbol",
  keywords: [
    "reta",
    "fútbol",
    "cascarita",
    "armar equipos",
    "equipos balanceados",
    "FIFA",
    "manager de fútbol",
    "marcador en vivo",
    "goleadores",
    "fútbol amateur",
  ],
  authors: [{ name: "La Reta" }, { name: "Luis Alvarez" }],
  creator: "Luis Alvarez",
  publisher: "La Reta",
  category: "sports",
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    siteName: "Reta Fútbol",
    title: "Reta Fútbol · Manager estilo FIFA para tu reta",
    description:
      "Crea jugadores con stats FIFA, arma equipos parejos y lleva el marcador en vivo. El club de la reta en modo carrera.",
    url: "/",
    locale: "es_MX",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reta Fútbol · Manager estilo FIFA para tu reta",
    description:
      "Crea jugadores con stats FIFA, arma equipos parejos y lleva el marcador en vivo.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: { capable: true, title: "Reta Fútbol" },
};

/**
 * `colorScheme: "dark light"` le dice al navegador que pinte scrollbars,
 * `<select>` nativos y autofill acordes al tema — sin esto se ven en claro
 * sobre el fondo oscuro. `themeColor` pinta la barra del navegador en móvil
 * con el mismo fondo de la app. Zoom queda habilitado a propósito (nada de
 * `userScalable: false`) y `viewportFit: "cover"` deja usar los safe areas.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
        oswald.variable
      )}
    >
      <body className="min-h-full">
        {/* Sin JS, Motion nunca llega a correr y todo lo que entra escalonado se
            quedaría en `opacity: 0`. Esta regla lo devuelve a visible. */}
        <noscript>
          <style>
            {
              '[data-motion="reveal"]{opacity:1!important;transform:none!important}'
            }
          </style>
        </noscript>
        <div className="root">
          <ClerkProvider>
            <Providers>
              <AppShell>{children}</AppShell>
              {/* El header es sticky (h-12): sin este offset los toasts caen
                  encima de él y tapan el título y el botón de sesión. */}
              <Toaster
                richColors
                position="top-center"
                offset={{ top: "4rem" }}
                mobileOffset={{ top: "4rem" }}
              />
            </Providers>
            {cloudflareWebAnalyticsToken ? (
              <Script
                src="https://static.cloudflareinsights.com/beacon.min.js"
                strategy="afterInteractive"
                data-cf-beacon={JSON.stringify({
                  token: cloudflareWebAnalyticsToken,
                })}
              />
            ) : null}
            <Analytics />
            <SpeedInsights />
          </ClerkProvider>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;
