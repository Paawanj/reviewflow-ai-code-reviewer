import { FileCode2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RagContextList({ contextUsed = [] }) {
  if (!Array.isArray(contextUsed) || contextUsed.length === 0) {
    return <p className="mt-3 text-sm text-[#56752d]">No matching indexed files were available, so this review used the pull-request diff only.</p>;
  }

  return (
    <ul className="mt-3 space-y-2">
      {contextUsed.map((chunk, index) => {
        const score = Number(chunk.score);
        const hasLineRange = Number.isInteger(chunk.startLine) && Number.isInteger(chunk.endLine);

        return (
          <li key={`${chunk.filePath || "context"}-${chunk.startLine || index}-${index}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-[#cce99a] bg-white/80 px-3 py-2 text-sm">
            <FileCode2 className="size-4 text-[#537d1a]" />
            <Badge variant="outline" className="border-[#b7dc78] bg-[#f7fce8] text-[#456d12]">Relevant file</Badge>
            <span className="font-medium text-slate-800">{chunk.filePath || "Unknown file"}{hasLineRange ? `:${chunk.startLine}-${chunk.endLine}` : ""}</span>
            {Number.isFinite(score) && <span className="text-slate-500">similarity {score.toFixed(2)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
