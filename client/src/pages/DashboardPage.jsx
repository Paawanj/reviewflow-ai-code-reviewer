import { useEffect, useMemo, useState } from "react";
import { AlertCircle, FolderGit2, GitPullRequest, ListChecks } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import ReviewAnalyticsCharts from "@/components/analytics/ReviewAnalyticsCharts";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecentSavedReviews, getReviewAnalytics } from "@/services/githubApi";

function MetricCard({ icon: Icon, label, value, detail }) {
  return (
    <Card className="workspace-card border-stone-200/90">
      <CardContent className="flex items-start justify-between p-5">
        <div>
          <p className="text-sm font-medium text-stone-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-stone-500">{detail}</p>
        </div>
        <span className="rounded-2xl bg-[#edfbd0] p-3 text-[#528116]">
          <Icon className="size-5" />
        </span>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [reviews, setReviews] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [savedReviews, savedAnalytics] = await Promise.all([
          getRecentSavedReviews(),
          getReviewAnalytics(),
        ]);

        setReviews(savedReviews);
        setAnalytics(savedAnalytics);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Could not load dashboard activity.");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const repositories = new Set(reviews.map((review) => review.repository));
    const pullRequests = new Set(
      reviews.map((review) => `${review.repository}-${review.pullRequestNumber}`)
    );
    const findingCount = reviews.reduce(
      (total, review) => total + (Array.isArray(review.findings) ? review.findings.length : 0),
      0
    );
    const scores = reviews.map((review) => Number(review.score)).filter(Number.isFinite);
    const averageScore = scores.length
      ? (scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)
      : "—";

    return {
      repositories: repositories.size,
      pullRequests: pullRequests.size,
      findingCount,
      averageScore,
    };
  }, [reviews]);

  return (
    <>
      <PageHeader
        title="Review dashboard"
        description="Saved AI review activity across your connected repositories."
      />

      {errorMessage && (
        <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <AlertCircle className="size-5 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Skeleton key={item} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={FolderGit2}
              label="Repositories reviewed"
              value={metrics.repositories}
              detail="With saved reviews"
            />
            <MetricCard
              icon={GitPullRequest}
              label="Pull requests"
              value={metrics.pullRequests}
              detail="Reviewed at least once"
            />
            <MetricCard
              icon={ListChecks}
              label="Findings"
              value={metrics.findingCount}
              detail="Across recent reviews"
            />
            <MetricCard
              icon={AlertCircle}
              label="Average score"
              value={metrics.averageScore}
              detail="Out of 10"
            />
          </div>

          {analytics && (
            <section className="mt-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-950">Review analytics</h2>
                <p className="mt-1 text-sm text-stone-500">
                  Real trends from reviews saved in PostgreSQL.
                </p>
              </div>
              <ReviewAnalyticsCharts analytics={analytics} />
            </section>
          )}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-950">Recent reviews</h2>
                <p className="mt-1 text-sm text-stone-500">
                The latest 20 saved AI reviews, newest first.
              </p>
            </div>

            {reviews.length === 0 ? (
              <Card className="workspace-card border-dashed border-stone-300">
                <CardContent className="p-8 text-center">
                  <h3 className="font-semibold text-slate-950">No saved reviews yet</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Open Pull Requests, generate your first review, then return here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} showRepository />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
