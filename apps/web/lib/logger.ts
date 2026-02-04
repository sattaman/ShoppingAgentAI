const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (msg: string, data?: unknown) => {
    if (isDev) console.log(`[INFO] ${msg}`, data ?? "");
  },
  error: (msg: string, error?: unknown) => {
    console.error(`[ERROR] ${msg}`, error ?? "");
  },
  debug: (msg: string, data?: unknown) => {
    if (isDev) console.log(`[DEBUG] ${msg}`, data ?? "");
  },
};
