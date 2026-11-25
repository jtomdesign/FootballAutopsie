import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/useAuth";
import { requestPasswordReset } from "../services/auth";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import Spinner from "../ui/Spinner";
import { useSEO } from "../utils/seo";

const inputCls =
  "w-full py-3.5 px-4 bg-emerald-900/40 text-gray-100 font-medium placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow";

const GoogleLogo = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
    />
  </svg>
);

const Account = () => {
  const { t } = useTranslation();
  useSEO({ title: "Mon compte", path: "/compte", noindex: true });
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const { submit, isPending, googleLogin } = useAuth(mode === "forgot" ? "login" : mode);
  const { isAuthenticated, hydrated } = useSelector(s => s.user);

  const resetMutation = useMutation({
    mutationFn: ({ email }) => requestPasswordReset(email),
    onSuccess: () => {
      toast.success(t("Lien de réinitialisation envoyé — vérifiez votre email"));
      setMode("login");
    },
    onError: err => toast.error(err.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  // Already signed in — /compte is the login page, send them to their space
  if (hydrated && isAuthenticated) return <Navigate to="/mon-espace" replace />;

  const onSubmit = data =>
    mode === "forgot" ? resetMutation.mutate(data) : submit(data);

  if (isPending || resetMutation.isPending) return <Spinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh]">
      <div className="h-full flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-emerald-950/60 border border-emerald-900/60 rounded-3xl p-6 sm:p-8 fa-fade-up">
          <h1 className="text-gray-100 text-2xl sm:text-3xl font-bold text-center mb-1">
            {mode === "login"
              ? t("Se connecter")
              : mode === "signup"
                ? t("Créer un compte")
                : t("Mot de passe oublié")}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-6">
            {mode === "login"
              ? t("Accédez à votre espace Football Autopsie")
              : mode === "signup"
                ? t("Rejoignez la communauté Football Autopsie")
                : t("Entrez votre email pour recevoir un lien de réinitialisation")}
          </p>

          {/* Mode toggle */}
          {mode !== "forgot" && (
          <div className="flex gap-1.5 mb-6">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                mode === "login"
                  ? "bg-emerald-500 text-white"
                  : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
              }`}
            >
              {t("Connexion")}
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-semibold cursor-pointer transition-colors ${
                mode === "signup"
                  ? "bg-emerald-500 text-white"
                  : "fa-tab-inactive bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"
              }`}
            >
              {t("Inscription")}
            </button>
          </div>
          )}

          <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="self-start text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer mb-1"
              >
                ← {t("Retour à la connexion")}
              </button>
            )}
            {mode === "signup" && (
              <div className="flex flex-col">
                <input
                  className={inputCls}
                  type="text"
                  placeholder={t("Votre nom")}
                  autoComplete="name"
                  {...register("name", {
                    required: mode === "signup" ? t("Ce champ est requis") : false,
                  })}
                />
                {errors?.name && (
                  <span className="text-red-500 p-1.5 text-xs font-semibold">
                    {errors.name.message}
                  </span>
                )}
              </div>
            )}
            <div className="flex flex-col">
              <input
                className={inputCls}
                type="email"
                placeholder={t("Votre email")}
                autoComplete="email"
                {...register("email", { required: t("Ce champ est requis") })}
              />
              {errors?.email && (
                <span className="text-red-500 p-1.5 text-xs font-semibold">
                  {errors.email.message}
                </span>
              )}
            </div>
            {mode !== "forgot" && (
            <div className="flex flex-col">
              <input
                className={inputCls}
                type="password"
                placeholder={t("Votre mot de passe")}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                {...register("password", {
                  required: t("Ce champ est requis"),
                  minLength:
                    mode === "signup"
                      ? { value: 6, message: t("6 caractères minimum") }
                      : false,
                })}
              />
              {errors?.password && (
                <span className="text-red-500 p-1.5 text-xs font-semibold">
                  {errors.password.message}
                </span>
              )}
            </div>
            )}
            {mode === "login" && (
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="self-end text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer -mt-1"
              >
                {t("Mot de passe oublié ?")}
              </button>
            )}
            <button
              className="mt-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-white font-semibold rounded-xl transition-colors"
              type="submit"
            >
              {mode === "login"
                ? t("Se connecter")
                : mode === "signup"
                  ? t("S'inscrire")
                  : t("Envoyer le lien")}
            </button>
          </form>

          {mode !== "forgot" && (
          <>
          <div className="flex items-center gap-3 my-5">
            <span className="flex-1 h-px bg-emerald-900/60" />
            <span className="text-[0.65rem] uppercase tracking-widest text-gray-500">
              {t("ou")}
            </span>
            <span className="flex-1 h-px bg-emerald-900/60" />
          </div>

          <button
            type="button"
            onClick={() => googleLogin()}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-emerald-900/60 text-gray-100 font-semibold text-sm hover:bg-emerald-500/10 transition-colors cursor-pointer"
          >
            <GoogleLogo />
            {t("Se connecter avec Google")}
          </button>
          </>
          )}
        </div>
      </div>
      <div
        style={{
          background: `url(/pattern.png) left center / cover no-repeat`,
        }}
        className="h-full hidden md:flex items-center justify-center"
      >
        <img className="w-60 drop-shadow-2xl" src="/fa-logo-white.png" alt="" />
      </div>
    </div>
  );
};

export default Account;
