import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { login, setHydrated } from "../features/authentication/authSlice";
import { useNavigate } from "react-router-dom";
import { signIn, signUp, signInWithGoogle } from "../services/auth";
import i18n from "../i18n";

/** Restore the Supabase session on app load. Call once in App. */
export const useSessionRestore = function () {
  const dispatch = useDispatch();
  useEffect(() => {
    let cancelled = false;
    import("../services/auth").then(({ restoreSession }) =>
      restoreSession()
        .then(user => {
          if (user && !cancelled) dispatch(login(user));
        })
        .finally(() => {
          if (!cancelled) dispatch(setHydrated());
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [dispatch]);
};

export const useAuth = function (mode = "login") {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSuccess = user => {
    dispatch(login(user));
    toast.success(i18n.t("Bienvenue {{name}}", { name: user.name }));
    navigate(user.role === "admin" ? "/dashboard" : "/");
  };

  const credentialsMutation = useMutation({
    mutationFn: mode === "signup" ? signUp : signIn,
    onSuccess,
    onError: err => toast.error(err.message),
  });

  const googleMutation = useMutation({
    mutationFn: signInWithGoogle,
    onError: err => toast.error(err.message),
  });

  return {
    submit: credentialsMutation.mutate,
    isPending: credentialsMutation.isPending,
    googleLogin: googleMutation.mutate,
    isGooglePending: googleMutation.isPending,
  };
};
