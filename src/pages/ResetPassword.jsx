import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { supabase } from "../services/supabase";
import { updatePassword } from "../services/auth";
import { useSEO } from "../utils/seo";

const inputCls =
  "w-full py-3.5 px-4 bg-emerald-900/40 text-gray-100 font-medium placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow";

const ResetPassword = () => {
  const { t } = useTranslation();
  useSEO({ title: "Nouveau mot de passe", path: "/reinitialiser-mot-de-passe", noindex: true });
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  // Supabase puts recovery tokens in the URL hash — the client exchanges
  // them for a session automatically. Wait for that before enabling submit.
  useEffect(() => {
    const timeout = setTimeout(() => setExpired(true), 8000);
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setReady(true);
        clearTimeout(timeout);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        clearTimeout(timeout);
      }
    });
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const mutation = useMutation({
    mutationFn: ({ password }) => updatePassword(password),
    onSuccess: () => {
      toast.success(t("Mot de passe mis à jour"));
      navigate("/compte");
    },
    onError: err => toast.error(err.message),
  });

  if (!ready)
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        {expired ? (
          <div className="text-center">
            <p className="text-gray-300 font-semibold mb-2">
              {t("Lien invalide ou expiré")}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {t("Demandez un nouveau lien de réinitialisation.")}
            </p>
            <Link
              to="/compte"
              className="text-sm font-semibold text-emerald-400 hover:text-emerald-300"
            >
              {t("Retour à la connexion")}
            </Link>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{t("Vérification du lien…")}</p>
        )}
      </div>
    );

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md bg-emerald-950/60 border border-emerald-900/60 rounded-3xl p-6 sm:p-8 fa-fade-up">
        <h1 className="text-gray-100 text-2xl sm:text-3xl font-bold text-center mb-1">
          {t("Nouveau mot de passe")}
        </h1>
        <p className="text-gray-500 text-sm text-center mb-6">
          {t("Choisissez un nouveau mot de passe pour votre compte")}
        </p>

        <form
          className="flex flex-col gap-3"
          onSubmit={handleSubmit(data => mutation.mutate(data))}
        >
          <div className="flex flex-col">
            <input
              className={inputCls}
              type="password"
              placeholder={t("Nouveau mot de passe")}
              autoComplete="new-password"
              {...register("password", {
                required: t("Ce champ est requis"),
                minLength: { value: 6, message: t("6 caractères minimum") },
              })}
            />
            {errors?.password && (
              <span className="text-red-500 p-1.5 text-xs font-semibold">
                {errors.password.message}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <input
              className={inputCls}
              type="password"
              placeholder={t("Confirmer le mot de passe")}
              autoComplete="new-password"
              {...register("confirm", {
                required: t("Ce champ est requis"),
                validate: v =>
                  v === watch("password") || t("Les mots de passe ne correspondent pas"),
              })}
            />
            {errors?.confirm && (
              <span className="text-red-500 p-1.5 text-xs font-semibold">
                {errors.confirm.message}
              </span>
            )}
          </div>
          <button
            className="mt-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t("Enregistrement…") : t("Mettre à jour")}
          </button>
        </form>

        <p className="text-center mt-5">
          <Link
            to="/compte"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            {t("Retour à la connexion")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
