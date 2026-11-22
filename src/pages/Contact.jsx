import React from "react";
import { useTranslation } from "react-i18next";
import { Container } from "../ui/Container";
import SectionHeader from "../components/football/SectionHeader";
import { RiMailLine, RiMapPinLine } from "react-icons/ri";

const Contact = () => {
  const { t } = useTranslation();
  return (
    <Container>
      <div className="py-16 max-w-2xl mx-auto text-center">
        <SectionHeader
          title={t("Contact")}
          subtitle={t("Une question, une suggestion, un partenariat ?")}
        />
        <div className="flex flex-col items-center gap-4 mt-8 text-gray-300">
          <p className="flex items-center gap-2">
            <RiMailLine className="text-emerald-400" /> contact@footballautopsie.com
          </p>
          <p className="flex items-center gap-2">
            <RiMapPinLine className="text-emerald-400" /> Football Autopsie — Football
          </p>
        </div>
      </div>
    </Container>
  );
};

export default Contact;
