import React, { useEffect, useRef, useState } from "react";

/** Animates a number from 0 to `value` with an ease-out curve. */
const CountUp = ({ value = 0, duration = 900, className = "" }) => {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {display.toLocaleString()}
    </span>
  );
};

export default CountUp;
