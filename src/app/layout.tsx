import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "@/styles.css";
import "@/components/PanelPreview.css";
import { RootProvider } from "fumadocs-ui/provider/next";

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
    "Aquadactyl is a free, open-source game server panel from Euphoria Development. Built on Pterodactyl, with Blueprint included and managed installation and updates.",
  openGraph: {
    type: "website",
    title: "Aquadactyl — Your panel. Built your way.",
    description:
      "Pterodactyl Panel with Blueprint built in. An open-source game server panel from Euphoria Development.",
    images: ["https://euphoriadevelopment.uk/web-app-manifest-512x512.png"],
  },
  icons: {
    icon: "/brand/favicon.png",
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
      <body className="antialiased">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
