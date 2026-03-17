import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "model";
  content: string;
}

const SUGGESTED = [
  "Apa itu DID?",
  "Cara register NIK?",
  "Apa itu Offline QR?",
  "Cara cek overstay?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
          isUser ? "bg-primary text-white" : "bg-muted border border-border"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
      </div>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-primary text-white rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm border border-border"
        }`}
        data-testid={`msg-${msg.role}`}
      >
        {msg.content}
      </div>
    </div>
  );
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content:
        "Halo! Saya SatuBot 👋\n\nSaya siap membantu kamu memahami platform SatuIdentitas. Ada yang ingin ditanyakan?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          messages: messages.filter((m) => m.role !== "model" || messages.indexOf(m) > 0),
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Maaf, saya tidak bisa menjawab saat ini.";
      setMessages([...newMessages, { role: "model", content: reply }]);

      if (!open) setUnread((u) => u + 1);
    } catch {
      setMessages([
        ...newMessages,
        { role: "model", content: "Maaf, terjadi kesalahan. Coba lagi sebentar." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => setOpen(true)}
              data-testid="button-open-chat"
              className="relative w-14 h-14 rounded-full bg-primary shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all flex items-center justify-center group"
            >
              <MessageCircle className="w-6 h-6 text-white" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                  {unread}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat window */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute bottom-0 right-0 w-[360px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden"
              style={{ height: "min(600px, calc(100vh - 100px))" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-primary text-white shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-none">SatuBot</p>
                    <p className="text-xs text-white/70 mt-0.5">Powered by Gemini AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  data-testid="button-close-chat"
                  className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}
                {loading && (
                  <div className="flex gap-2 items-end">
                    <div className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-bl-sm border border-border">
                      <TypingDots />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Suggestions (only show when only welcome msg visible) */}
              {messages.length === 1 && !loading && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      data-testid={`suggestion-${s}`}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="px-3 py-3 border-t border-border bg-background shrink-0">
                <div className="flex gap-2 items-end bg-muted rounded-xl px-3 py-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Tulis pertanyaan..."
                    rows={1}
                    data-testid="input-chat"
                    className="flex-1 bg-transparent text-sm resize-none outline-none min-h-[20px] max-h-[100px] leading-5 text-foreground placeholder:text-muted-foreground"
                    style={{ overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    data-testid="button-send-chat"
                    className="shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {loading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground mt-1.5">
                  Enter kirim · Shift+Enter baris baru
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Close button when open */}
      <AnimatePresence>
        {open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(false)}
            data-testid="button-chat-close-fab"
            className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-muted border border-border shadow-md hover:bg-muted/80 transition-all flex items-center justify-center"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
