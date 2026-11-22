import React, { useCallback, useEffect, useState } from "react";
import { ThemeContext } from "./context";

// Light is the default theme; "dark" restores the original dark palette.
// The choice persists in localStorage and is applied to <html> as the
// `.light` class (dark = no class), matching the CSS variable remap.
export const ThemeProvider = ({ children }) => {
  const [isLight, setIsLight] = useState(
    () => localStorage.getItem("fa-theme") !== "dark",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLight);
  }, [isLight]);

  const toggle = useCallback(() => {
    setIsLight(v => {
      const next = !v;
      localStorage.setItem("fa-theme", next ? "light" : "dark");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isLight, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};
