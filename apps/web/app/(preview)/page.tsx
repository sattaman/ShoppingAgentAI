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
  const [messages, setMessages] = useState<Array<{ id: number; node: ReactNode }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();

  const suggestedActions = [
    { title: "Browse", label: "all products", action: "Show me all products" },
    { title: "Search", label: "by category", action: "What product categories do you have?" },
  ];

  const addMessage = (node: ReactNode) => {
    const id = ++messageId;
    setMessages((m) => [...m, { id, node }]);
  };

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="flex flex-col justify-between gap-4">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-3 h-full w-dvw items-center overflow-y-scroll"
        >
          {messages.length === 0 && (
            <motion.div className="h-[350px] px-4 w-full md:w-[500px] md:px-0 pt-20">
              <div className="border rounded-lg p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
                <p className="text-zinc-900 dark:text-zinc-50 font-medium">
                  Shopping Agent AI
                </p>
                <p>
                  Ask me to show you products from the catalogue.
                </p>
              </div>
            </motion.div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>{msg.node}</div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px] mb-4">
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
                  className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                >
                  <span className="font-medium">{action.title}</span>
                  <span className="text-zinc-500 dark:text-zinc-400">{action.label}</span>
                </button>
              </motion.div>
            ))}
        </div>

        <form
          className="flex flex-col gap-2 relative items-center"
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
            className="bg-zinc-100 rounded-md px-2 py-1.5 w-full outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300 md:max-w-[500px] max-w-[calc(100dvw-32px)]"
            placeholder="Ask about products..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}
