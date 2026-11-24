import React from "react";
import { useSelector } from "react-redux";
import { useContactMessages, useDeleteContactMessage } from "../../hooks/user";
import { formatDateTime } from "../../utils/helpers";
import { CardGridSkeleton } from "../../components/football/Skeleton";
import EmptyState from "../../components/football/EmptyState";
import Modal from "../../ui/Modal";
import ConfirmDelete from "../../ui/ConfirmDelete";
import {
  LuTrash2,
  LuMail,
  LuInbox,
  LuReply,
} from "react-icons/lu";

const Messages = () => {
  const { user } = useSelector(s => s.user);
  const isStaff = user?.role === "admin" || user?.role === "editor";
  const { data: messages = [], isLoading, isError, error } =
    useContactMessages(isStaff);
  const remove = useDeleteContactMessage();

  if (!isStaff)
    return (
      <EmptyState
        title="Accès refusé"
        message="Seuls les administrateurs et éditeurs peuvent lire les messages."
      />
    );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-100 flex items-center gap-2">
          <LuInbox className="text-emerald-400" /> Messages
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {messages.length} message{messages.length > 1 ? "s" : ""} reçu
          {messages.length > 1 ? "s" : ""} via le formulaire de contact.
        </p>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : isError ? (
        <EmptyState
          title="Erreur de chargement"
          message={
            error?.message ??
            "Impossible de charger les messages. La migration contact_messages est-elle appliquée ?"
          }
        />
      ) : messages.length ? (
        <div className="flex flex-col gap-3">
          {messages.map(m => (
            <div
              key={m.id}
              className="bg-emerald-950/60 rounded-2xl px-5 py-4 flex flex-col sm:flex-row gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-lg shrink-0">
                <LuMail />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-100">
                    {m.name}
                  </span>
                  <a
                    href={`mailto:${m.email}?subject=Re: ${m.subject ?? "Contact"}`}
                    className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <LuReply /> {m.email}
                  </a>
                  <span className="text-[0.65rem] text-gray-400">
                    {formatDateTime(m.created_at)}
                  </span>
                </div>
                {m.subject && (
                  <p className="text-sm font-semibold text-gray-200 mt-1">
                    {m.subject}
                  </p>
                )}
                <p className="text-sm text-gray-300 mt-1 whitespace-pre-wrap break-words">
                  {m.message}
                </p>
              </div>
              <div className="flex items-start gap-2 shrink-0">
                <a
                  href={`mailto:${m.email}?subject=Re: ${m.subject ?? "Contact"}`}
                  className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                  title="Répondre par email"
                >
                  <LuReply />
                </a>
                <Modal>
                  <Modal.Open opens="delete">
                    <button
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <LuTrash2 />
                    </button>
                  </Modal.Open>
                  <Modal.Window name="delete">
                    <ConfirmDelete
                      element={`le message de ${m.name}`}
                      isDeleting={remove.isPending}
                      onConfirm={() => remove.mutate(m.id)}
                    />
                  </Modal.Window>
                </Modal>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun message"
          message="Les messages envoyés via la page Contact apparaîtront ici."
        />
      )}
    </div>
  );
};

export default Messages;
