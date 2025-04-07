import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1024;

export default function useMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    
    const handleResize = () => {
      setIsMobile(window.innerWidth >= MOBILE_BREAKPOINT);
    };
    
    // Initial check
    handleResize();
    
    // Add listener
    window.addEventListener("resize", handleResize);
    mql.addEventListener("change", handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      mql.removeEventListener("change", handleResize);
    };
  }, []);

  return isMobile;
}
