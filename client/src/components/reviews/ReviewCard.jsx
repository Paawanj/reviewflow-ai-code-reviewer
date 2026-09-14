import { MessageCircle, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SeverityBadge from "./SeverityBadge";
import RagContextList from "./RagContextList";
import FixSuggestionPanel from "./FixSuggestionPanel";
import FindingChatPanel from "./FindingChatPanel";
import { generateFindingFix } from "@/services/githubApi";

function formatReviewDate(dateValue) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export default function ReviewCard({ review, showRepository = false, diffText = "" }) {
  const [fixByIndex, setFixByIndex] = useState({});
  const [fixingIndex, setFixingIndex] = useState(null);
  const [fixError, setFixError] = useState(null);
  const [chatOpenByIndex, setChatOpenByIndex] = useState({});

  function extractCodeContext(finding) {
    if (!diffText) return "";

    const lines = diffText.split("\n");
    const targetFile = finding.file || "";
    const targetLine = finding.line || 0;

    // Find the diff section for this file
    const fileHeaderIndex = lines.findIndex(
      (line) => line.startsWith("diff --git") && line.includes(targetFile)
    );

    if (fileHeaderIndex === -1) {
      // File not found in diff — return a general section of the diff
      return diffText.slice(0, 2000);
    }

    // Find the next file header to bound this file's diff
    const nextFileIndex = lines.findIndex(
      (line, index) => index > fileHeaderIndex && line.startsWith("diff --git")
    );

    const fileDiffLines = lines.slice(
      fileHeaderIndex,
      nextFileIndex === -1 ? undefined : nextFileIndex
    );

    return fileDiffLines.join("\n").slice(0, 3000);
  }

  async function handleGenerateFix(finding, index) {
    setFixingIndex(index);
    setFixError(null);

    try {
      const codeContext = extractCodeContext(finding);
      const fix = await generateFindingFix({
        findingDescription: finding.description,
        suggestion: finding.suggestion,
        filePath: finding.file,
        line: finding.line || 0,
        codeContext: codeContext || `// File: ${finding.file}\n// Line: ${finding.line}\n// (Diff context was not available. The fix is based on the finding description.)`,
      });

      setFixByIndex((current) => ({ ...current, [index]: fix }));
    } catch (error) {
      setFixError(
        error.response?.data?.message || "Could not generate a fix. Please try again."
      );
    } finally {
      setFixingIndex(null);
    }
  }

  function dismissFix(index) {
    setFixByIndex((current) => {
      const next = { ...current };
      delete next[index];
      return next;
    });
  }

  function toggleChat(index) {
    setChatOpenByIndex((current) => {
      const next = { ...current };
      if (next[index]) {
        delete next[index];
      } else {
        next[index] = true;
      }
      return next;
    });
  }

  return (
    <Card className="overflow-hidden border-stone-200 shadow-none">
      <CardHeader className="border-b border-stone-200 bg-[#fafaf7]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-[#6e9c29]" />
              AI review
            </CardTitle>
            {showRepository && (
              <p className="mt-1 text-sm text-stone-500">
                {review.repository} · PR #{review.pullRequestNumber}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[#b8f250]/30 text-[#426614]">Score {review.score}/10</Badge>
            {review.createdAt && (
              <span className="text-xs text-stone-500">{formatReviewDate(review.createdAt)}</span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <p className="text-sm leading-6 text-stone-700">{review.summary}</p>

        <section className="rounded-xl border border-[#b8f250]/60 bg-[#f4fadd] p-3.5">
          <h3 className="text-sm font-semibold text-[#365313]">Related code used for this review</h3>
          <p className="mt-1 text-sm text-[#56752d]">Relevant files from the connected codebase were considered alongside the pull-request changes.</p>
          <RagContextList contextUsed={review.contextUsed} />
        </section>

        {fixError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {fixError}
          </p>
        )}

        {review.findings.length === 0 ? (
          <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            No concrete issues found in this diff. Verify manually before merging.
          </p>
        ) : (
          <section>
            <h3 className="mb-3 text-sm font-semibold text-slate-950">
              Findings ({review.findings.length})
            </h3>
            <div className="space-y-3">
              {review.findings.map((finding, index) => (
                <article
                  key={`${finding.file}-${finding.line}-${index}`}
                  className="rounded-xl border border-stone-200 bg-white p-3.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={finding.severity} />
                    <Badge variant="outline">{finding.category}</Badge>
                    <span className="text-sm text-stone-500">
                      {finding.file}:{finding.line || "?"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-900">{finding.description}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Suggestion: {finding.suggestion}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {!fixByIndex[index] && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGenerateFix(finding, index)}
                        disabled={fixingIndex !== null}
                        className="gap-2 text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <Wrench className="size-3.5" />
                        {fixingIndex === index ? "Generating fix..." : "Generate Fix"}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleChat(index)}
                      className="gap-2 text-purple-700 border-purple-200 hover:bg-purple-50"
                    >
                      <MessageCircle className="size-3.5" />
                      {chatOpenByIndex[index] ? "Close Chat" : "Ask AI"}
                    </Button>
                  </div>

                  {fixByIndex[index] && (
                    <FixSuggestionPanel
                      fix={fixByIndex[index]}
                      onDismiss={() => dismissFix(index)}
                    />
                  )}

                  {chatOpenByIndex[index] && (
                    <FindingChatPanel
                      finding={finding}
                      codeContext={extractCodeContext(finding)}
                      onDismiss={() => toggleChat(index)}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
