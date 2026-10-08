import type { Metadata, Viewport } from "next";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@/styles.css";
import "@/components/PanelPreview.css";
import "@/documentation.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToLocation from "@/components/ScrollToLocation";

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
    <html lang="en">
      <body>
        <div id="top">
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <ScrollToLocation />
          <Header />
          <div id="main-content" tabIndex={-1}>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
