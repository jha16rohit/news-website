import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();
  const { pathname, search, hash } = location;

  useEffect(() => {
    const resetScroll = () => {
      const root = document.scrollingElement as HTMLElement | null;

      if (root) {
        root.scrollTop = 0;
        root.scrollLeft = 0;
      }

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    };

    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "manual";
    }

    const frameId = window.requestAnimationFrame(resetScroll);
    const timeoutId = window.setTimeout(resetScroll, 0);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [pathname, search, hash]);

  return null;
}