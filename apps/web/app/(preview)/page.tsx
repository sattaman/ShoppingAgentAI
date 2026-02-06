"use client";

import { ReactNode, useRef, useState } from "react";
import { useActions } from "ai/rsc";
import { Message } from "@/components/chat";
import { useScrollToBottom } from "@/hooks";
import { motion } from "framer-motion";

let messageId = 0;

export default function Home() {
  const { sendMessage } = useActions();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    Array<{ id: number; node: ReactNode }>
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    {
      title: "Show me",
      label: "armchairs",
      action: "Show me armchairs",
    },
    {
      title: "Find",
      label: "glassware",
      action: "Show me glassware",
    },
    {
      title: "Browse",
      label: "bedroom furniture",
      action: "Show me bedroom furniture",
    },
    {
      title: "Search for",
      label: "bar accessories",
      action: "Show me bar accessories",
    },
  ];

  const addMessage = (node: ReactNode) => {
    const id = ++messageId;
    setMessages((m) => [...m, { id, node }]);
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(20,20,20,0.06),_transparent_45%),linear-gradient(to_bottom,#f8f7f3,#f1f1ec_45%,#efece6)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_50%),linear-gradient(to_bottom,#0b0b0c,#111214_45%,#0b0b0c)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col px-4 pb-24 pt-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
              Conversational Commerce
            </div>
            <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Shopping Agent
            </div>
          </div>
        </div>
        <div
          ref={messagesContainerRef}
          className="flex flex-1 flex-col gap-4 overflow-y-auto pb-6"
        >
          {messages.length === 0 && (
            <motion.div className="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 text-sm text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
              <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Find products by describing your room, budget, and style.
              </div>
              <div className="mt-3 text-zinc-500 dark:text-zinc-400">
                I can search the catalog, compare options, and build your cart.
                Try “light oak bedside tables under $200”.
              </div>
            </motion.div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>{msg.node}</div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {messages.length === 0 &&
            suggestedActions.map((action, index) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.01 * index }}
                key={index}
              >
                <button
                  onClick={async () => {
                    addMessage(<Message role="user" content={action.action} />);
                    const response = await sendMessage(action.action);
                    addMessage(response);
                  }}
                  className="w-full rounded-2xl border border-zinc-200/70 bg-white/80 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/70 dark:hover:border-zinc-500"
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {action.title}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    {action.label}
                  </div>
                </button>
              </motion.div>
            ))}
        </div>

        <div className="sticky bottom-6 mt-4">
          <form
            className="flex items-center gap-3 rounded-full border border-zinc-200/70 bg-white/90 px-4 py-2 shadow-lg backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!input.trim()) return;
              addMessage(<Message role="user" content={input} />);
              setInput("");
              const response = await sendMessage(input);
              addMessage(response);
            }}
          >
            <input
              ref={inputRef}
              className="flex-1 bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200 dark:placeholder:text-zinc-500"
              placeholder="Ask about products, styles, or budgets..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-zinc-800"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
