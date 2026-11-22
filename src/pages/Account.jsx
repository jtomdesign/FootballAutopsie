import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { FcGoogle } from "react-icons/fc";
import { useForm } from "react-hook-form";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../ui/Spinner";

const inputCls =
  "w-full py-3.5 px-4 bg-emerald-900/40 text-gray-100 font-medium placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-shadow";

const Account = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState("login"); // login | signup
  const { submit, isPending, googleLogin } = useAuth(mode);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = data => submit(data);

  if (isPending) return <Spinner />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-[90vh]">
      <div className="h-full flex items-center justify-center py-10 px-4">
        <div className="w-full max-w-md bg-emerald-950/60 border border-emerald-900/60 rounded-3xl p-6 sm:p-8 fa-fade-up">
          <h1 className="text-gray-100 text-2xl sm:text-3xl font-bold text-center mb-1">
            {mode === "login" ? t("Se connecter") : t("Créer un compte")}
          </h1>
          <p className="text-gray-500 text-sm text-center mb-6">
            {mode === "login"
              ? t("Accédez à votre espace Football Autopsie")
              : t("Rejoignez la communauté Football Autopsie")}
          </p>

          {/* Mode toggle */}
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

          <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
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
            <button
              className="mt-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 py-3.5 px-4 text-white font-semibold rounded-xl transition-colors"
              type="submit"
            >
              {mode === "login" ? t("Se connecter") : t("S'inscrire")}
            </button>
          </form>

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
            <FcGoogle className="text-lg" />
            {t("Se connecter avec Google")}
          </button>
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
