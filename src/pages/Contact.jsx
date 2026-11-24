import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { Container } from "../ui/Container";
import SectionHeader from "../components/football/SectionHeader";
import { useSEO } from "../utils/seo";
import { supabase } from "../services/supabase";
import {
  LuMail,
  LuMapPin,
  LuClock,
  LuSend,
  LuNewspaper,
  LuFeather,
} from "react-icons/lu";

const inputCls =
  "fa-input w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow";

const InfoCard = ({ icon: Icon, title, children }) => (
  <div className="flex items-start gap-3 bg-emerald-950/60 border border-emerald-900/60 rounded-2xl p-4">
    <span className="shrink-0 w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
      <Icon className="text-lg" />
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-100">{title}</p>
      <div className="text-gray-400 text-sm mt-0.5">{children}</div>
    </div>
  </div>
);

const Contact = () => {
  const { t } = useTranslation();
  useSEO({
    title: "Contact — Football Autopsie",
    description: "Contactez la rédaction de Football Autopsie : news, partenariats, corrections et contributions.",
    path: "/contact",
  });
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const onSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t("Veuillez remplir tous les champs obligatoires"));
      return;
    }
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim() || null,
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      toast.error(t("Envoi impossible pour le moment"));
      return;
    }
    toast.success(t("Message envoyé — nous vous répondrons rapidement"));
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <Container>
      <div className="py-10 max-w-5xl mx-auto">
        <SectionHeader level={1}
          title={t("Contact")}
          subtitle={t("Une question, une suggestion, un partenariat ? Écrivez-nous.")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-2">
          {/* Info */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <InfoCard icon={LuMail} title={t("Email")}>
              <a
                href="mailto:contact@footautopsie.com"
                className="text-emerald-400 hover:underline"
              >
                contact@footautopsie.com
              </a>
            </InfoCard>
            <InfoCard icon={LuClock} title={t("Délai de réponse")}>
              {t("Sous 48 h ouvrées")}
            </InfoCard>
            <InfoCard icon={LuNewspaper} title={t("Presse & partenariats")}>
              {t("Décrivez votre demande dans le formulaire, nous vous orienterons.")}
            </InfoCard>
            <InfoCard icon={LuFeather} title={t("Contributions")}>
              {t("Analyses, interviews, contenu exclusif : vos articles peuvent être publiés sur Football Autopsie.")}
            </InfoCard>
          </div>

          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="lg:col-span-3 bg-emerald-950/60 border border-emerald-900/60 rounded-3xl p-6 sm:p-8 flex flex-col gap-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  {t("Nom")} *
                </label>
                <input
                  value={form.name}
                  onChange={set("name")}
                  placeholder={t("Votre nom")}
                  className={inputCls}
                  maxLength={100}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                  {t("Email")} *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="vous@exemple.com"
                  className={inputCls}
                  maxLength={150}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                {t("Sujet")}
              </label>
              <input
                value={form.subject}
                onChange={set("subject")}
                placeholder={t("Objet de votre message")}
                className={inputCls}
                maxLength={150}
              />
            </div>
            <div className="flex-1 flex flex-col">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                {t("Message")} *
              </label>
              <textarea
                value={form.message}
                onChange={set("message")}
                placeholder={t("Écrivez votre message…")}
                rows={7}
                className={`${inputCls} flex-1 resize-none`}
                maxLength={3000}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="self-start inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-60 cursor-pointer"
            >
              <LuSend />
              {sending ? t("Envoi…") : t("Envoyer")}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
};

export default Contact;
