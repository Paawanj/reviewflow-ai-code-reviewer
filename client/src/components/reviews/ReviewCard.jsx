import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SeverityBadge from "./SeverityBadge";
import RagContextList from "./RagContextList";

function formatReviewDate(dateValue) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

export default function ReviewCard({ review, showRepository = false }) {
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
                </article>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
