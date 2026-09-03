import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function EmptyChart({ message }) {
  return <div className="grid h-64 place-items-center text-center text-sm text-slate-500">{message}</div>;
}

export default function ReviewAnalyticsCharts({ analytics }) {
  const hasReviews = analytics.totalReviews > 0;
  const hasFindings = analytics.findingsByCategory.some((item) => item.count > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Average review score</CardTitle>
          <p className="text-sm text-slate-500">Monthly average across saved reviews from the last six months.</p>
        </CardHeader>
        <CardContent>
          {!hasReviews ? (
            <EmptyChart message="Generate and save reviews to see score trends." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.scoreByMonth} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis domain={[0, 10]} tickCount={6} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip formatter={(value) => value === null ? "No reviews" : `${value} / 10`} />
                  <Area
                    type="monotone"
                    dataKey="averageScore"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#scoreGradient)"
                    connectNulls={false}
                    dot={{ r: 6, fill: "#2563eb", stroke: "#ffffff", strokeWidth: 3 }}
                    activeDot={{ r: 7 }}
                  >
                    <LabelList
                      dataKey="averageScore"
                      position="top"
                      formatter={(value) => (value === null ? "" : `${value}/10`)}
                      fill="#1e3a8a"
                      fontSize={12}
                    />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Findings by category</CardTitle>
          <p className="text-sm text-slate-500">Issue types found across the same saved review period.</p>
        </CardHeader>
        <CardContent>
          {!hasFindings ? (
            <EmptyChart message="No saved findings yet. A clean review is still useful data." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.findingsByCategory} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip formatter={(value) => `${value} findings`} />
                  <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
