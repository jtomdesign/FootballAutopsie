import React from "react";

/** Animated hamburger ↔ X toggle. `open` controls the morph state. */
const HamburgerIcon = ({ open = false, small = false, className = "" }) => (
  <span
    className={`relative block ${small ? "w-5 h-3.5" : "w-6 h-5"} ${className}`}
    aria-hidden="true"
  >
    <span
      className={`absolute left-0 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
        open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
      }`}
    />
    <span
      className={`absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
        open ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
      }`}
    />
    <span
      className={`absolute left-0 w-full h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out ${
        open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
      }`}
    />
  </span>
);

export default HamburgerIcon;
