import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { chatAboutFinding } from "@/services/githubApi";

export default function FindingChatPanel({
  finding,
  codeContext,
  onDismiss,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsSending(true);
    setChatError(null);

    try {
      const reply = await chatAboutFinding({
        findingDescription: finding.description,
        suggestion: finding.suggestion,
        filePath: finding.file,
        codeContext: codeContext || `// File: ${finding.file}\n// (No diff context available)`,
        messages: updatedMessages,
      });

      setMessages((current) => [
        ...current,
        { role: "assistant", content: reply },
      ]);
    } catch (error) {
      setChatError(
        error.response?.data?.message ||
          "Could not get a response. Please try again."
      );
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  function formatContent(text) {
    // Split by code blocks (triple backticks)
    const parts = text.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        // Code block — strip the backticks and optional language tag
        const lines = part.slice(3, -3).split("\n");
        const firstLine = lines[0].trim();
        // If the first line looks like a language identifier, remove it
        const hasLang = firstLine && !firstLine.includes(" ") && firstLine.length < 20;
        const code = hasLang ? lines.slice(1).join("\n") : lines.join("\n");

        return (
          <pre
            key={index}
            className="my-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-stone-200 bg-stone-50 p-3 font-mono text-xs leading-5 text-stone-800"
          >
            <code>{code.trim()}</code>
          </pre>
        );
      }

      // Regular text — handle inline code with single backticks
      const inlineParts = part.split(/(`[^`]+`)/g);
      return (
        <span key={index}>
          {inlineParts.map((inline, i) => {
            if (inline.startsWith("`") && inline.endsWith("`")) {
              return (
                <code
                  key={i}
                  className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-800"
                >
                  {inline.slice(1, -1)}
                </code>
              );
            }
            return inline;
          })}
        </span>
      );
    });
  }

  return (
    <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-purple-900">
          <MessageCircle className="size-4 text-purple-600" />
          Ask about this finding
        </h4>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-7 w-7 p-0 text-stone-400 hover:text-stone-600"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {messages.length > 0 && (
        <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-purple-100 bg-white p-3">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-6 ${
                  msg.role === "user"
                    ? "bg-purple-600 text-white"
                    : "bg-stone-100 text-stone-800"
                }`}
              >
                {msg.role === "assistant" ? formatContent(msg.content) : msg.content}
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-xl bg-stone-100 px-3.5 py-2.5 text-sm text-stone-500">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      {chatError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {chatError}
        </p>
      )}

      <div className="flex gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this finding..."
          disabled={isSending}
          rows={1}
          className="flex-1 resize-none rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 disabled:opacity-50"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={isSending || !input.trim()}
          className="gap-1.5 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          <Send className="size-3.5" />
          Send
        </Button>
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            "Why is this a problem?",
            "Explain in simpler terms",
            "What happens if I don't fix this?",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setInput(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs text-purple-700 transition-colors hover:bg-purple-50 hover:border-purple-300"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
