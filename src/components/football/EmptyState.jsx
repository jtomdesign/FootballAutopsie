import React from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

const EmptyState = ({
  title,
  message,
  icon,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-2xl mb-4">
        {icon ?? <HiOutlineMagnifyingGlass />}
      </div>
      <h3 className="text-gray-100 font-bold text-lg mb-1">
        {title ?? t("Aucune donnée")}
      </h3>
      <p className="text-gray-400 text-sm max-w-sm">
        {message ?? t("Les données ne sont pas encore disponibles.")}
      </p>
    </div>
  );
};

export default EmptyState;
