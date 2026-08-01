import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, AlertCircle, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { streamChatMessage } from "@/lib/api/chat";
import { TurnstileGate, TURNSTILE_ENABLED } from "@/components/security/TurnstileGate";
import { toast } from "sonner";
import { useSession } from "@/features/auth/SessionProvider";

type Message = {
  id: string;
  role: "user" | "assistant" | "error_bubble";
  text: string;
  isRetryable?: boolean;
};

const MarkdownRenderer = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: ({ node, ...props }) => <a target="_blank" rel="noopener noreferrer" className="text-violet-400 underline underline-offset-2 hover:text-violet-300" {...props} />,
      ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
      ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
      strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
      p: ({ node, ...props }) => <p className="last:mb-0 mb-2 leading-relaxed" {...props} />
    }}
  >
    {content}
  </ReactMarkdown>
);

export function ChatOrb() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    role: "assistant",
    text: "Hey — I'm your jOBiON assistant. Ask about a role, or drop a JD and I'll score your resume against it."
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tsToken, setTsToken] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<"none" | "budget" | "turnstile">("none");
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const { session } = useSession();
  
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, errorState]);

  useEffect(() => {
    if (errorState === "turnstile" && tsToken && pendingMessage) {
      const msgToRetry = pendingMessage;
      setPendingMessage(null);
      setErrorState("none");
      sendMessage(msgToRetry, true);
    }
  }, [tsToken, errorState, pendingMessage]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sendMessage = async (text: string, isRetry = false) => {
    if (!isRetry) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text }]);
    }
    
    if (isRetry) {
        setMessages(prev => prev.filter(m => m.role !== "error_bubble"));
    }
    
    setIsLoading(true);
    setErrorState("none");

    const assistantId = `${Date.now()}-assistant`;
    let assistantStarted = false;

    try {
      await streamChatMessage(
        text,
        (event) => {
          if (event.type === "token") {
            if (!assistantStarted) {
              assistantStarted = true;
              setIsLoading(false);
              setMessages(prev => [...prev, { id: assistantId, role: "assistant", text: event.text }]);
            } else {
              setMessages(prev =>
                prev.map(m => (m.id === assistantId ? { ...m, text: m.text + event.text } : m))
              );
            }
          } else if (event.type === "error" && !assistantStarted) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: "error_bubble",
              text: event.message,
              isRetryable: true,
            }]);
            setPendingMessage(text);
          }
        },
        { turnstileToken: tsToken ?? undefined },
      );

      setPendingMessage(null);

      if (!session && TURNSTILE_ENABLED) {
          setTsToken(null);
      }

    } catch (err: any) {
      if (err.status === 429) {
        setErrorState("budget");
        setPendingMessage(text);
        return;
      }
      if (err.status === 401 && (err.code === "turnstile_required" || err.code === "turnstile_invalid")) {
        setTsToken(null);
        setPendingMessage(text);
        setErrorState("turnstile");
        return;
      }
      if (err.status === 422) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: "error_bubble", 
          text: "Message format invalid (422).", 
          isRetryable: true 
        }]);
        setPendingMessage(text);
        return;
      }

      toast.error("Network error. Please check your connection.");
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "error_bubble", 
        text: "Network failure.", 
        isRetryable: true 
      }]);
      setPendingMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

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
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 flex h-[100dvh] w-full sm:h-[600px] sm:w-[400px] flex-col overflow-hidden sm:rounded-2xl border-t sm:border border-white/10 bg-background/95 backdrop-blur-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            <div
              className="flex shrink-0 items-center justify-between border-b border-border/60 px-4 py-3"
              style={{ backgroundImage: "var(--gradient-brand-soft)" }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <MessageCircle className="h-4 w-4" />
                </span>
                <div>
                    <h3 className="text-sm font-semibold">jOBiON Assistant</h3>
                    <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="rounded-full p-2 text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm pb-8">
              {messages.map(msg => (
                  <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                      {msg.role === 'error_bubble' ? (
                          <div className="flex flex-col items-center gap-2 w-full mt-2">
                              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg text-xs">
                                  <AlertCircle className="h-4 w-4" />
                                  {msg.text}
                              </div>
                              {msg.isRetryable && pendingMessage && (
                                  <button onClick={() => sendMessage(pendingMessage, true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                      <RefreshCw className="h-3 w-3" /> Retry
                                  </button>
                              )}
                          </div>
                      ) : (
                          <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'border border-border/60 bg-card/60 text-foreground/90 rounded-tl-sm shadow-sm'}`}>
                              {msg.role === 'assistant' ? <MarkdownRenderer content={msg.text} /> : msg.text}
                          </div>
                      )}
                  </motion.div>
              ))}
              
              {isLoading && (
                  <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex w-full justify-start"
                  >
                      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-border/60 bg-card/60 px-4 py-3 flex items-center gap-1.5 shadow-sm">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
                      </div>
                  </motion.div>
              )}
              
              {errorState === "turnstile" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center p-4">
                      <TurnstileGate enabled={true} onToken={setTsToken} compact={true} />
                  </motion.div>
              )}
              
              <div ref={bottomRef} className="h-1" />
            </div>

            <div className="shrink-0 border-t border-border/60 p-3 bg-background/80 backdrop-blur-md pb-safe">
              {errorState === "budget" && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-500 border border-yellow-500/20">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      The AI assistant has reached today's usage limit. Try again tomorrow.
                  </div>
              )}
              
              <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={isLoading || errorState === "budget"}
                    rows={1}
                    className="w-full resize-none rounded-xl border border-border/70 bg-background/60 pl-4 pr-12 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60 transition-all max-h-32"
                    style={{ minHeight: "44px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || errorState === "budget"}
                    className="absolute right-2 bottom-2 p-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:bg-muted disabled:text-muted-foreground transition-colors"
                  >
                      <Send className="h-4 w-4" />
                  </button>
              </div>
              <div className="mt-1.5 text-center text-[10px] text-muted-foreground/60 font-medium">
                jOBiON AI can make mistakes. Check important info.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
