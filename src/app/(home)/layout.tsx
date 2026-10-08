import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToLocation from "@/components/ScrollToLocation";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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
  );
}
