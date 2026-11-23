import { supabase } from "./supabase";

/** Fetch the editorial role for an authenticated user. */
async function getRole(userId) {
  const { data } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role ?? "user";
}

function toAppUser(authUser, role) {
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    name: meta.name ?? meta.full_name ?? authUser.email?.split("@")[0] ?? "User",
    email: authUser.email,
    createdAt: authUser.created_at,
    avatarUrl: meta.avatar_url ?? meta.picture ?? null,
    role,
  };
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  const role = await getRole(data.user.id);
  return toAppUser(data.user, role);
}

export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.session) {
    throw new Error(
      "Compte créé — vérifiez votre email pour confirmer votre inscription.",
    );
  }
  const role = await getRole(data.user.id);
  return toAppUser(data.user, role);
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
  if (error) throw new Error(error.message);
}

export async function restoreSession() {
  const { data } = await supabase.auth.getSession();
  const authUser = data.session?.user;
  if (!authUser) return null;
  const role = await getRole(authUser.id);
  return toAppUser(authUser, role);
}

export async function signOut() {
  await supabase.auth.signOut();
}

/**
 * Fire-and-forget login alert to the admin (Supabase Edge Function).
 * Runs at most once per browser session per user — safe to call on every
 * login/session restore. Fails silently if the function isn't deployed.
 */
export function notifyLoginAlert(user) {
  if (!user?.id) return;
  try {
    const key = `fa-login-alert-${user.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    supabase.functions
      .invoke("login-alert")
      .catch(() => sessionStorage.removeItem(key));
  } catch {
    /* sessionStorage unavailable — skip */
  }
}
