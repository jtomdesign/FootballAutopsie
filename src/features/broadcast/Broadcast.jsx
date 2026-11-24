import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  LuSend,
  LuBell,
} from "react-icons/lu";
import { adminBroadcastNotification } from "../../services/user";
import EmptyState from "../../components/football/EmptyState";

const inputCls =
  "fa-input w-full px-4 py-2.5 text-sm rounded-xl";

const Broadcast = () => {
  const { user } = useSelector(s => s.user);
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetUrl, setTargetUrl] = useState("");

  const send = useMutation({
    mutationFn: adminBroadcastNotification,
    onSuccess: count => {
      toast.success(
        `${count} notification${count > 1 ? "s" : ""} envoyée${count > 1 ? "s" : ""}`,
      );
      setTitle("");
      setMessage("");
      setTargetUrl("");
      qc.invalidateQueries({ queryKey: ["user"] });
    },
    onError: e => toast.error(e?.message ?? "Échec de l'envoi"),
  });

  if (user?.role !== "admin")
    return (
      <EmptyState
        title="Accès refusé"
        message="Seuls les administrateurs peuvent envoyer une notification globale."
      />
    );

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100 flex items-center gap-2">
          <LuBell className="text-emerald-400" /> Diffusion
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Envoyez une notification à tous les utilisateurs inscrits.
        </p>
      </div>

      <div className="bg-emerald-950/60 rounded-2xl p-5 flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
            Titre *
          </label>
          <input
            className={inputCls}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Ex : Nouveau livescore disponible"
            maxLength={120}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
            Message
          </label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Texte affiché dans la notification…"
            maxLength={500}
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-1.5">
            Lien (optionnel)
          </label>
          <input
            className={inputCls}
            value={targetUrl}
            onChange={e => setTargetUrl(e.target.value)}
            placeholder="/news/mon-article"
          />
        </div>
        <button
          onClick={() =>
            title.trim() &&
            send.mutate({
              title: title.trim(),
              message: message.trim() || null,
              targetUrl: targetUrl.trim() || null,
            })
          }
          disabled={!title.trim() || send.isPending}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
        >
          <LuSend />
          {send.isPending ? "Envoi…" : "Envoyer à tous les utilisateurs"}
        </button>
      </div>
    </div>
  );
};

export default Broadcast;
