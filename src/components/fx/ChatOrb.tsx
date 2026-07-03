import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";

export function ChatOrb() {
  const [open, setOpen] = useState(false);



  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            key="orb"
            layoutId="chat-orb"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat assistant"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-white shadow-[0_20px_60px_-15px_rgba(139,92,246,0.7)] backdrop-blur-xl"
            style={{ background: "var(--gradient-brand)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full opacity-20"
              style={{ background: "var(--gradient-brand)" }}
            />
            <MessageCircle className="relative h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            layoutId="chat-orb"
            className="fixed bottom-6 right-6 z-50 flex h-[440px] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            <div
              className="flex items-center justify-between border-b border-border/60 px-4 py-3"
              style={{ backgroundImage: "var(--gradient-brand-soft)" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <MessageCircle className="h-3 w-3" />
                </span>
                <span className="text-sm font-medium">jOBiON assistant</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-card/60 px-3 py-2 text-foreground/90"
              >
                Hey — I'm your jOBiON assistant. Ask about a role, or drop a JD and
                I'll score your resume against it.
              </motion.div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
              </div>
            </div>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="border-t border-border/60 p-3"
            >
              <input
                type="text"
                placeholder="Chat coming soon…"
                disabled
                className="w-full rounded-lg border border-border/70 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
