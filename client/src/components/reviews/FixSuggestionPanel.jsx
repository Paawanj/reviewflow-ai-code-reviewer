import { Check, Copy, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function FixSuggestionPanel({ fix, onDismiss }) {
  const [copiedField, setCopiedField] = useState(null);

  async function copyToClipboard(text, fieldName) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      console.error("Failed to copy to clipboard.");
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Sparkles className="size-4 text-blue-600" />
          AI-Generated Fix
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

      <p className="text-sm leading-6 text-blue-800">{fix.explanation}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-red-700">
              Before
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(fix.originalCode, "original")}
              className="h-6 gap-1 px-2 text-xs text-stone-500 hover:text-stone-700"
            >
              {copiedField === "original" ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              {copiedField === "original" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-red-200 bg-red-50 p-3 font-mono text-xs leading-5 text-red-900">
            <code>{fix.originalCode}</code>
          </pre>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
              After
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(fix.fixedCode, "fixed")}
              className="h-6 gap-1 px-2 text-xs text-stone-500 hover:text-stone-700"
            >
              {copiedField === "fixed" ? (
                <Check className="size-3" />
              ) : (
                <Copy className="size-3" />
              )}
              {copiedField === "fixed" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-green-200 bg-green-50 p-3 font-mono text-xs leading-5 text-green-900">
            <code>{fix.fixedCode}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
