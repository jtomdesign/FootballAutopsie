import React from "react";

const Button = ({
  name = "Button",
  type = "primary",
  onClick,
  role,
  icon = null,
  color = null,
}) => {
  const types = {
    primary:
      "bg-emerald-500 hover:bg-emerald-600 transition-all duration-200 px-7 py-3  flex items-center justify-center gap-2 text-white rounded-full font-bold cursor-pointer",
    simple: `hover:text-emerald-400 transition-all  duration-200 px-2 py-3 text-[0.9rem] flex items-center justify-center gap-1 ${color ? color : "text-emerald-950"} rounded-full font-semibold cursor-pointer`,
    danger:
      "bg-red-700  hover:bg-red-900 transition-all duration-200 px-7 py-3  flex items-center justify-center gap-2 text-red-50 rounded-full font-bold cursor-pointer",
    secondary:
      "border-emerald-500 hover:text-white  hover:bg-emerald-600 transition-all duration-300 border px-7 py-3 flex items-center justify-center  gap-2 text-emerald-600 rounded-full font-bold cursor-pointer",
    white:
      " hover:text-emerald-950  hover:bg-emerald-100 transition-all bg-emerald-900/40 duration-300  px-7 py-3 flex items-center justify-center  gap-2 text-gray-100 rounded-full font-bold cursor-pointer",
  };
  return (
    <button type={role} onClick={onClick} className={types[type]}>
      <span className="flex items-center justify-center ">{icon && icon}</span>
      <span>{name}</span>
    </button>
  );
};

export default Button;
