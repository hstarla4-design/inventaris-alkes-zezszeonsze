function write(level, message, meta = {}) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...meta,
  };
  console[level === "error" ? "error" : "log"](JSON.stringify(payload));
}

export const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};
