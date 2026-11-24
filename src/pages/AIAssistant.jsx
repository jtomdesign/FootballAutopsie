import React, { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { useSEO } from "../utils/seo";
import { LuSendHorizontal, LuUser, LuBot, LuPlus } from "react-icons/lu";

const SUGGESTIONS = [
  "Pronostic pour le prochain Clasico ?",
  "Qui sont les meilleurs buteurs de Ligue 1 ?",
  "Analyse la forme du Real Madrid",
  "Quels matchs y a-t-il en direct aujourd'hui ?",
  "Explique la règle du hors-jeu",
];

const AIAssistant = () => {
  useSEO({
    title: "Football Autopsie IA — Pronostics, stats et analyses",
    description:
      "Pose tes questions football à l'assistant IA de Football Autopsie : pronostics, stats joueurs, classements et analyses.",
    path: "/assistant",
  });

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async text => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply =
        data?.choices?.[0]?.message?.content ??
        data?.error ??
        "Désolé, je n'ai pas pu répondre.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError("Impossible de joindre l'assistant. Réessaie.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <Container>
      <div className="py-8 max-w-3xl mx-auto flex flex-col" style={{ minHeight: "70dvh" }}>
        {/* Header */}
        <div className="mb-6 relative flex flex-col items-center text-center">
          <LuBot className="text-3xl text-emerald-500 mb-2" />
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-50 tracking-tight">
            Football Autopsie IA
          </h1>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                setError(null);
                inputRef.current?.focus();
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors cursor-pointer text-xs font-medium"
              title="Nouvelle conversation"
            >
              <LuPlus className="text-sm" />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col gap-4 mb-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-5 py-10">
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mt-0.5">
                  <LuBot className="text-sm" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white rounded-2xl rounded-br-md"
                    : "text-gray-200"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-700/30 text-emerald-200 flex items-center justify-center mt-0.5">
                  <LuUser className="text-sm" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5 justify-start">
              <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mt-0.5">
                <LuBot className="text-sm" />
              </div>
              <div className="flex items-center gap-1.5 px-4 py-3">
                {[0, 1, 2].map(d => (
                  <span
                    key={d}
                    className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"
                    style={{ animationDelay: `${d * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={e => {
            e.preventDefault();
            send();
          }}
          className="fa-ai-inputbar flex gap-2 items-center px-2 py-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pose ta question football…"
            maxLength={1000}
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="shrink-0 p-2 text-emerald-600 hover:text-emerald-500 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Envoyer"
          >
            <LuSendHorizontal className="text-lg" />
          </button>
        </form>
        <p className="text-[0.65rem] text-gray-600 text-center mt-3">
          L'IA peut se tromper — les pronostics ne garantissent rien.
        </p>
      </div>
    </Container>
  );
};

export default AIAssistant;
