import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import ScrollToLocation from "@/components/ScrollToLocation";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#11161b",
};

export const metadata: Metadata = {
  title: "Aquadactyl | Euphoria Development",
  description:
    "Aquadactyl is a free, open-source game server panel from Euphoria Development. Built on Pterodactyl, with a charcoal theme, bundled Blueprint, an Egg Library, simpler schedules and managed updates.",
  openGraph: {
    type: "website",
    title: "Aquadactyl — Your panel. Built your way.",
    description:
      "A Pterodactyl fork with a charcoal theme, bundled Blueprint, an integrated Egg Library and simpler server schedules.",
    images: ["https://euphoriadevelopment.uk/web-app-manifest-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "Aquadactyl",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen min-w-[320px] flex-col antialiased">
        <RootProvider>
          <div id="top" className="flex min-h-screen flex-col">
            <a
              className="fixed -top-25 left-5 z-100 rounded-[5px] bg-[#20696d] px-5 py-3.5 text-white transition-all focus:top-2.5"
              href="#main-content"
            >
              Skip to content
            </a>
            <ScrollToLocation />
            <div
              id="main-content"
              tabIndex={-1}
              className="flex flex-1 flex-col"
            >
              {children}
            </div>
          </div>
        </RootProvider>
      </body>
    </html>
  );
}
