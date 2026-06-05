import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, AlertCircle } from "lucide-react";
import { ChatMessage } from "../types";

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Welcome to eShop Private Boutique! I am your AI Style Curator. Ask me anything about our premium wireless audio, bespoke leathercases, minimal chronographs, or summer linen apparels.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on message addition
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputText.trim();
    if (!textToSend || isLoading) return;

    if (!customText) {
      setInputText("");
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!response.ok) {
        throw new Error("Chat api failed");
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "assistant",
          text: "I am experiencing network static trying to connect with our style archive. Please attempt to select your prompt again shortly.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggest = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* Mini floating launcher button */}
      {!isOpen && (
        <button
          id="open-ai-shopper-btn"
          onClick={() => setIsOpen(true)}
          className="flex items-center space-x-2 px-4.5 py-3.5 rounded-full bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 shadow-xl border border-stone-800 dark:border-amber-400 cursor-pointer transform hover:scale-105 transition-all text-xs tracking-wider uppercase font-semibold"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Style Assistant</span>
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
          </span>
        </button>
      )}

      {/* Styled Assistant Panel Chatbox */}
      {isOpen && (
        <div className="w-[21.5rem] md:w-[24.5rem] h-[32rem] rounded-xl bg-white dark:bg-slate-950 shadow-2xl border border-stone-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-stone-900 text-stone-100 dark:bg-slate-950 dark:border-b dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1 rounded bg-amber-500 text-slate-900">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-sans text-xs font-bold tracking-wider uppercase">Bespoke Shopping Assistant</h3>
                <p className="text-[10px] text-amber-400 font-mono">Cognitive Gemini Agent Online</p>
              </div>
            </div>
            <button
              id="close-ai-shopper-btn"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Dialogue Log list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50 dark:bg-slate-900/40">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-lg text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-stone-900 text-white dark:bg-amber-500 dark:text-slate-950 rounded-br-none"
                      : "bg-white text-stone-800 dark:bg-slate-900 dark:text-slate-200 border border-stone-200/80 dark:border-slate-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  {/* Process basic format markdown */}
                  <p className="whitespace-pre-line font-sans">{m.text}</p>
                </div>
                <span className="text-[9px] text-stone-400 dark:text-slate-500 ml-1 mt-1 font-mono">{m.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-stone-400 dark:text-slate-500 text-xs font-mono p-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
                <span>Curating catalog insights...</span>
              </div>
            )}
            <div ref={chatEndRef}></div>
          </div>

          {/* Quick Prompts Recommendations */}
          <div className="px-4 py-2 border-t border-stone-200/50 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleQuickSuggest("What products are under $100?")}
              className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-full font-medium text-stone-700 cursor-pointer"
            >
              under $100?
            </button>
            <button
              onClick={() => handleQuickSuggest("Help me match a casual travel outfit.")}
              className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-full font-medium text-stone-700 cursor-pointer"
            >
              Outfit match
            </button>
            <button
              onClick={() => handleQuickSuggest("Is there any promo discount?")}
              className="text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 px-2.5 py-1.5 rounded-full font-medium text-stone-700 cursor-pointer"
            >
              Promo codes
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask the style advisor..."
              className="flex-1 bg-stone-100 dark:bg-slate-900 text-xs px-3.5 py-2.5 rounded-lg border border-transparent focus:border-stone-400 dark:focus:border-amber-400 focus:outline-none dark:text-slate-200"
            />
            <button
              id="ai-shopper-send-btn"
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${
                inputText.trim() && !isLoading
                  ? "bg-stone-900 text-stone-50 dark:bg-amber-500 dark:text-slate-950 hover:bg-stone-800 cursor-pointer"
                  : "bg-stone-100 text-stone-400 dark:bg-slate-900 dark:text-slate-600 border border-transparent focus:outline-none cursor-not-allowed"
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
