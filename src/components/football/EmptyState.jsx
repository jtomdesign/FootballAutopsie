import React from "react";
import { useTranslation } from "react-i18next";

const EmptyState = ({ title }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-6 px-6 text-center">
      <h3 className="text-gray-100 font-semibold text-sm">
        {title ?? t("Aucune donnée")}
      </h3>
    </div>
  );
};

export default EmptyState;
