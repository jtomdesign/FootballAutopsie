import React, { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { useSEO } from "../utils/seo";
import { LuSparkles, LuSend, LuUser, LuBot } from "react-icons/lu";

const SUGGESTIONS = [
  "Pronostic pour le prochain Clasico ?",
  "Qui sont les meilleurs buteurs de Ligue 1 ?",
  "Analyse la forme du Real Madrid",
  "Quels matchs y a-t-il en direct aujourd'hui ?",
  "Explique la règle du hors-jeu",
];

const AIAssistant = () => {
  useSEO({
    title: "Assistant IA Football — Pronostics, stats et analyses",
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
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600/15 text-emerald-500 mb-3">
            <LuSparkles className="text-2xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-50">
            Assistant IA Football
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Pronostics, stats joueurs, classements, analyses — pose ta question.
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col gap-3 mb-4 overflow-y-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="px-4 py-2 rounded-full fa-input text-xs font-semibold hover:border-emerald-500/50 hover:text-emerald-600 transition-colors cursor-pointer"
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
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.role === "assistant" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
                  <LuBot className="text-base" />
                </div>
              )}
              <div
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white rounded-br-md"
                    : "bg-emerald-950/60 border border-emerald-900/60 text-gray-200 rounded-bl-md"
                }`}
              >
                {m.content}
              </div>
              {m.role === "user" && (
                <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-700/40 text-emerald-200 flex items-center justify-center">
                  <LuUser className="text-base" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-500 flex items-center justify-center">
                <LuBot className="text-base" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-emerald-950/60 border border-emerald-900/60 flex items-center gap-1.5">
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
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Pose ta question football…"
            maxLength={1000}
            className="fa-input flex-1 px-4 py-3 rounded-xl text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="shrink-0 w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 disabled:opacity-40 transition-colors cursor-pointer"
            aria-label="Envoyer"
          >
            <LuSend className="text-lg" />
          </button>
        </form>
        <p className="text-[0.65rem] text-gray-500 text-center mt-3">
          L'IA peut se tromper — les pronostics ne garantissent rien.
        </p>
      </div>
    </Container>
  );
};

export default AIAssistant;
