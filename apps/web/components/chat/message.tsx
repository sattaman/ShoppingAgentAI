"use client";

import { motion } from "framer-motion";
import { BotIcon, UserIcon } from "@/components/ui";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

export const Message = ({
  role,
  content,
  isError,
}: {
  role: "assistant" | "user";
  content: string | ReactNode;
  isError?: boolean;
}) => {
  const isUser = role === "user";
  const renderedContent =
    typeof content === "string" ? <Streamdown>{content}</Streamdown> : content;
  return (
    <motion.div
      className={`flex w-full px-4 md:px-0 ${isUser ? "justify-end" : "justify-start"}`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className={`flex max-w-[720px] items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm ${
            isUser
              ? "border-zinc-900 bg-zinc-900 text-white"
              : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          {isUser ? <UserIcon /> : <BotIcon />}
        </div>
        <div
          className={`chat-prose rounded-2xl px-4 py-3 text-[15px] leading-relaxed shadow-sm ${
            isUser
              ? "bg-zinc-900 text-white"
              : "border border-zinc-200/70 bg-white/90 text-zinc-800 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
          } ${isError ? "border-red-300 text-red-600" : ""}`}
        >
          {renderedContent}
        </div>
      </div>
    </motion.div>
  );
};
