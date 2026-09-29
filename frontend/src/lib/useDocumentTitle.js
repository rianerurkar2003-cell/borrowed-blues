import { useEffect } from "react";

/** Sets the browser tab / SEO title for the page it's called from. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
