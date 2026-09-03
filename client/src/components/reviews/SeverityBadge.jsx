import { Badge } from "@/components/ui/badge";

const variantBySeverity = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export default function SeverityBadge({ severity }) {
  const label = severity || "unknown";

  return (
    <Badge variant={variantBySeverity[label.toLowerCase()] || "outline"}>
      {label}
    </Badge>
  );
}
