import React, { useEffect, useState } from "react";
import { HiArrowUp } from "react-icons/hi2";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Retour en haut"
      className="fa-back-to-top fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 flex items-center justify-center hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer"
    >
      <HiArrowUp className="text-lg" />
    </button>
  );
};

export default BackToTop;
