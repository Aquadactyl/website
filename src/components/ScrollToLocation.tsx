"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToLocation() {
  const pathname = usePathname();

  useEffect(() => {
    function scrollToHash() {
      if (window.location.hash) {
        const id = window.location.hash.slice(1);
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
              .matches
              ? "instant"
              : "smooth",
            block: "start",
          });
        }
      } else {
        window.scrollTo(0, 0);
      }
    }

    const timer = setTimeout(scrollToHash, 60);
    window.addEventListener("hashchange", scrollToHash);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  return null;
}
