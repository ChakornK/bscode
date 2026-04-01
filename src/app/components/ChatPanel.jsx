"use client"

import { useState } from "react";
import ChatInput from "./ChatInput";

export default function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Hi. This is a visual scaffold for your chat panel.",
    },
  ]);

  const handleSend = (text) => {
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    setTimeout(() => {
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Stub response. Wire backend later.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 350);
  };

  return (
    <aside className="grid grid-rows-[48px_1fr_auto] w-[32vw] min-w-75 max-w-105 h-screen">
      <header className="flex items-center px-3 border-zinc-800 border-b h-12 font-semibold">
        Copilot Chat
      </header>

      <section className="flex flex-col gap-2 p-3 overflow-y-auto">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-2 ${
              m.role === "user"
                ? "border-sky-700/60 bg-sky-900/20"
                : "border-zinc-700 bg-zinc-800"
            }`}
          >
            <div className="opacity-70 mb-1 text-xs">
              {m.role === "user" ? "You" : "Copilot"}
            </div>
            <div>{m.content}</div>
          </div>
        ))}
      </section>

      <ChatInput onSend={handleSend} />
    </aside>
  );
}