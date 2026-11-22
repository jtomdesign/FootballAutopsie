import React from "react";
import { NavLink } from "react-router-dom";

const base =
  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors";
const idle = "text-emerald-100/60 hover:text-white hover:bg-white/5";
const active = "bg-emerald-500/15 text-white";

const DashLink = ({ to, children, onClick = null, end = false }) => {
  if (onClick)
    return (
      <button onClick={onClick} className={`${base} ${idle} w-full text-left cursor-pointer`}>
        {children}
      </button>
    );
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `${base} ${isActive ? active : idle}`}
    >
      {children}
    </NavLink>
  );
};

function Icon({ children }) {
  return <span className="text-emerald-400 text-base shrink-0">{children}</span>;
}
function Name({ children }) {
  return <span>{children}</span>;
}

DashLink.Icon = Icon;
DashLink.Name = Name;

export default DashLink;
