import React from "react";
import { useTheme } from "../theme/context";

/**
 * Theme-aware logo.
 * surface="dark" → always white logo (sidebar, dark surfaces)
 * surface="light" → follows the theme: dark logo on light, white on dark
 */
const Logo = ({ surface = "dark", className = "w-full", alt = "Football Autopsie" }) => {
  const { isLight } = useTheme();
  const useWhite = surface === "dark" || !isLight;
  return (
    <img
      className={className}
      src={useWhite ? "/fa-logo-white-long.png" : "/fa-logo-dark-long.png"}
      alt={alt}
    />
  );
};

export default Logo;
