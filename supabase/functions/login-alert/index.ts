// Supabase Edge Function: send an email alert to the admin on each login.
//
// Deploy:  supabase functions deploy login-alert
// Secrets: supabase secrets set RESEND_API_KEY=... ADMIN_ALERT_EMAIL=... \
//            RESEND_FROM="Football Autopsie <alert@footautopsie.com>"
//
// The client calls this right after a successful login/session restore.
// verify_jwt is enabled by default, so only authenticated users can trigger it.

import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL");
const FROM =
  Deno.env.get("RESEND_FROM") ?? "Football Autopsie <onboarding@resend.dev>";

Deno.serve(async req => {
  try {
    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      return new Response("Email alert not configured", { status: 503 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const email = user.email ?? "unknown";
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [ADMIN_EMAIL],
        subject: `Connexion : ${name} (${email})`,
        html: `
          <div style="font-family:sans-serif;max-width:480px">
            <h2 style="color:#059669">Football Autopsie — Nouvelle connexion</h2>
            <p><strong>Utilisateur :</strong> ${name}</p>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Date :</strong> ${new Date().toISOString()}</p>
          </div>`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error", res.status, body);
      return new Response("Email send failed", { status: 502 });
    }
    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("Internal error", { status: 500 });
  }
});
