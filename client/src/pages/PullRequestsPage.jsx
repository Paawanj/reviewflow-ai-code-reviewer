import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import RepositoryPickerForm from "@/components/forms/RepositoryPickerForm";
import ReviewCard from "@/components/reviews/ReviewCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createPullRequestReview, getPullRequestDiff, getPullRequestReviewHistory, getPullRequests } from "@/services/githubApi";

export default function PullRequestsPage() {
  const [searchParams] = useSearchParams();
  const initialOwner = searchParams.get("owner") || "";
  const initialRepo = searchParams.get("repo") || "";
  const [selectedRepository, setSelectedRepository] = useState({ owner: initialOwner, repo: initialRepo });
  const [pullRequests, setPullRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [reviewingNumber, setReviewingNumber] = useState(null);
  const [reviewsByNumber, setReviewsByNumber] = useState({});
  const [historyByNumber, setHistoryByNumber] = useState({});
  const [loadingHistoryNumber, setLoadingHistoryNumber] = useState(null);
  const automaticLoadKey = useRef(null);

  async function loadPullRequests({ owner, repo }) {
    const cleanOwner = owner.trim(); const cleanRepo = repo.trim();
    setIsLoading(true); setErrorMessage(""); setHasSearched(true); setReviewsByNumber({}); setHistoryByNumber({}); setSelectedRepository({ owner: cleanOwner, repo: cleanRepo });
    try { setPullRequests(await getPullRequests(cleanOwner, cleanRepo)); }
    catch (error) { setErrorMessage(error.response?.data?.message || "Could not load pull requests."); }
    finally { setIsLoading(false); }
  }

  useEffect(() => {
    if (!initialOwner || !initialRepo) return;
    const key = `${initialOwner}/${initialRepo}`;
    if (automaticLoadKey.current === key) return;
    automaticLoadKey.current = key;
    loadPullRequests({ owner: initialOwner, repo: initialRepo });
  }, [initialOwner, initialRepo]);

  async function loadReviewHistory(pullNumber) {
    setLoadingHistoryNumber(pullNumber); setErrorMessage("");
    try { const reviews = await getPullRequestReviewHistory(selectedRepository.owner, selectedRepository.repo, pullNumber); setHistoryByNumber((current) => ({ ...current, [pullNumber]: reviews })); }
    catch (error) { setErrorMessage(error.response?.data?.message || "Could not load saved review history."); }
    finally { setLoadingHistoryNumber(null); }
  }

  function toggleReviewHistory(pullNumber) {
    if (historyByNumber[pullNumber]) { setHistoryByNumber((current) => { const next = { ...current }; delete next[pullNumber]; return next; }); return; }
    loadReviewHistory(pullNumber);
  }

  async function reviewPullRequest(pullNumber) {
    setReviewingNumber(pullNumber); setErrorMessage("");
    try {
      const [data, diff] = await Promise.all([
        createPullRequestReview(selectedRepository.owner, selectedRepository.repo, pullNumber),
        getPullRequestDiff(selectedRepository.owner, selectedRepository.repo, pullNumber),
      ]);
      setReviewsByNumber((current) => ({ ...current, [pullNumber]: { review: data.review, contextUsed: data.contextUsed || [], diff: diff || "" } }));
    } catch (error) { setErrorMessage(error.code === "ECONNABORTED" ? "The AI review took too long. Try again with a smaller pull request." : error.response?.data?.message || "Could not create an AI review."); }
    finally { setReviewingNumber(null); }
  }

  return <>
    <PageHeader title="Pull Requests" description="Load a pull request, then generate an AI review with related repository context when it is available." />
    <RepositoryPickerForm initialOwner={initialOwner} initialRepo={initialRepo} isLoading={isLoading} onSubmit={loadPullRequests} />
    {errorMessage && <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
    {hasSearched && !isLoading && !errorMessage && pullRequests.length === 0 && <EmptyState title="No open pull requests" message="This repository has no open pull requests." />}
    {isLoading && <p className="mb-5 text-sm text-slate-500">Loading pull requests...</p>}
    <div className="space-y-4">{pullRequests.map((pullRequest) => {
      const result = reviewsByNumber[pullRequest.number]; const currentReview = result ? { ...result.review, contextUsed: result.contextUsed } : null; const reviewHistory = historyByNumber[pullRequest.number]; const isReviewing = reviewingNumber === pullRequest.number; const isLoadingHistory = loadingHistoryNumber === pullRequest.number;
      return <Card key={pullRequest.id} className="workspace-card border-stone-200/90"><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>#{pullRequest.number} {pullRequest.title}</CardTitle><p className="mt-1 text-sm text-stone-500">Opened by {pullRequest.author}</p></div><Badge variant={pullRequest.isDraft ? "secondary" : "default"}>{pullRequest.isDraft ? "draft" : pullRequest.state}</Badge></CardHeader><CardContent><div className="flex flex-wrap items-center gap-3"><Button onClick={() => reviewPullRequest(pullRequest.number)} disabled={isReviewing}>{isReviewing ? "Reviewing..." : "Generate AI review"}</Button><Button variant="outline" onClick={() => toggleReviewHistory(pullRequest.number)} disabled={isLoadingHistory}>{isLoadingHistory ? "Loading history..." : reviewHistory ? "Hide saved history" : "View saved history"}</Button><a className="text-sm font-medium text-[#62851d] hover:underline" href={pullRequest.htmlUrl} target="_blank" rel="noreferrer">Open pull request on GitHub</a></div>{currentReview && <section className="mt-6"><p className="mb-3 text-sm font-semibold text-slate-950">Latest generated review</p><ReviewCard review={currentReview} diffText={result?.diff || ""} /></section>}{reviewHistory && <section className="mt-6 border-t border-stone-200 pt-6"><h2 className="text-base font-semibold text-slate-950">Saved review history</h2>{reviewHistory.length === 0 ? <p className="mt-3 text-sm text-stone-500">No saved reviews exist for this pull request yet.</p> : <div className="mt-4 space-y-4">{reviewHistory.map((review) => <ReviewCard key={review.id} review={review} />)}</div>}</section>}</CardContent></Card>;
    })}</div>
  </>;
}
