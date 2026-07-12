import { useEffect, useState } from "react";

export function useBreakpoint(maxWidth: number) {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth <= maxWidth : false,
  );

  useEffect(() => {
    function handleResize() {
      setMatches(window.innerWidth <= maxWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [maxWidth]);

  return matches;
}
