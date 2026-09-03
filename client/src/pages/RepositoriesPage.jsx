import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, FolderGit2, GitBranch, RefreshCw, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { addRepository, deleteAddedRepository, getAddedRepositories, getRepositories, reindexRepository } from "@/services/githubApi";

const statusClasses = { QUEUED: "bg-amber-100 text-amber-800", INDEXING: "bg-blue-100 text-blue-800", READY: "bg-green-100 text-green-800", FAILED: "bg-red-100 text-red-800" };

function statusText(repository) {
  if (repository.indexStatus === "READY") return "Ready for pull-request reviews.";
  if (repository.indexStatus === "INDEXING") return "Reading source code and preparing it for reviews.";
  if (repository.indexStatus === "QUEUED") return "Waiting for the local indexing worker.";
  return repository.indexError || "This repository could not be indexed.";
}

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState([]);
  const [addedRepositories, setAddedRepositories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addingRepositoryFullName, setAddingRepositoryFullName] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [reindexingRepositoryId, setReindexingRepositoryId] = useState(null);
  const [githubConnectionNeeded, setGithubConnectionNeeded] = useState(false);
  const loadAddedRepositories = useCallback(async () => {
    const added = await getAddedRepositories();
    setAddedRepositories(added);
    return added;
  }, []);

  useEffect(() => {
    async function loadPage() {
      try {
        const [githubResult, addedResult] = await Promise.allSettled([getRepositories(), loadAddedRepositories()]);
        if (addedResult.status === "rejected") throw addedResult.reason;
        if (githubResult.status === "fulfilled") setRepositories(githubResult.value);
        else if (githubResult.reason?.response?.status === 409) setGithubConnectionNeeded(true);
        else setErrorMessage(githubResult.reason?.response?.data?.message || "Could not load GitHub repositories.");
      } catch (error) { setErrorMessage(error.response?.data?.message || "Could not load your added repositories."); }
      finally { setIsLoading(false); }
    }
    loadPage();
  }, [loadAddedRepositories]);

  useEffect(() => {
    if (!addedRepositories.some((item) => ["QUEUED", "INDEXING"].includes(item.indexStatus))) return undefined;
    const intervalId = window.setInterval(() => loadAddedRepositories().catch(() => {}), 4000);
    return () => window.clearInterval(intervalId);
  }, [addedRepositories, loadAddedRepositories]);

  const visibleRepositories = useMemo(() => {
    const addedNames = new Set(addedRepositories.map((item) => item.fullName.toLowerCase()));
    return repositories.filter((item) => (
      item.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      && !addedNames.has(item.fullName.toLowerCase())
    ));
  }, [repositories, addedRepositories, searchTerm]);

  async function queueRepository(values, repositoryFullName = null) {
    setErrorMessage(""); setIsSubmitting(true);
    setAddingRepositoryFullName(repositoryFullName);
    try { await addRepository(values); await loadAddedRepositories(); return true; }
    catch (error) { setErrorMessage(error.response?.data?.message || "Could not add this repository."); return false; }
    finally { setIsSubmitting(false); setAddingRepositoryFullName(null); }
  }
  async function handleAdd(event) { event.preventDefault(); const queued = await queueRepository({ owner: owner.trim(), repo: repo.trim() }); if (queued) { setOwner(""); setRepo(""); } }
  async function handleDelete(repository) {
    if (!window.confirm(`Remove ${repository.fullName} from your indexed codebases?`)) return;
    setErrorMessage("");
    try { await deleteAddedRepository(repository.id); await loadAddedRepositories(); }
    catch (error) { setErrorMessage(error.response?.data?.message || "Could not remove this codebase."); }
  }

  async function handleReindex(repository) {
    setErrorMessage("");
    setReindexingRepositoryId(repository.id);
    try {
      await reindexRepository(repository.id);
      await loadAddedRepositories();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not re-index this codebase.");
    } finally {
      setReindexingRepositoryId(null);
    }
  }

  return <>
    <PageHeader title="Codebases" description="Add a public repository or choose one from GitHub. Once indexing finishes, it can support its pull-request reviews." action={<span className="hidden items-center gap-2 text-xs font-medium text-stone-500 sm:flex"><CheckCircle2 className="size-4 text-green-700" /> {addedRepositories.filter((item) => item.indexStatus === "READY").length} ready</span>} />
    <section className="app-panel mb-8 p-5 sm:p-6"><div className="mb-4"><p className="eyebrow mb-2">Bring your own context</p><h2 className="text-xl font-semibold tracking-tight">Add a repository</h2><p className="mt-1 text-sm text-stone-500">Enter any public GitHub repository, or a private repository your connected account can access.</p></div><form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={handleAdd}><Input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Owner or organization" required /><Input value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="Repository name" required /><Button type="submit" disabled={isSubmitting}>{isSubmitting && !addingRepositoryFullName ? "Adding..." : "Add and index"}<ArrowRight className="size-4" /></Button></form></section>
    {errorMessage && <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>}
    <section className="mb-10"><div className="mb-4"><p className="eyebrow mb-2">Your review library</p><h2 className="text-xl font-semibold">Indexed codebases</h2><p className="mt-1 text-sm text-stone-500">Only ready codebases are used as supporting context for reviews.</p></div>{isLoading ? <p className="text-sm text-stone-500">Loading repository status...</p> : addedRepositories.length === 0 ? <EmptyState title="No codebases added yet" message="Add a repository above to start indexing it." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{addedRepositories.map((item) => <Card key={item.id} className="workspace-card border-stone-200/90"><CardHeader><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-[#f0f4eb]"><FolderGit2 className="size-5 text-[#62851d]" /></span><Badge className={statusClasses[item.indexStatus] || "bg-stone-100 text-stone-700"}>{item.indexStatus}</Badge></div><CardTitle className="mt-5 text-base">{item.fullName}</CardTitle><p className="min-h-10 text-sm leading-5 text-stone-500">{statusText(item)}</p></CardHeader><CardContent className="flex flex-wrap gap-2">{item.indexStatus === "READY" && <Link className={buttonVariants({ size: "sm" })} to={`/pull-requests?owner=${encodeURIComponent(item.owner)}&repo=${encodeURIComponent(item.name)}`}>Review PRs <ArrowRight className="size-3.5" /></Link>}{item.indexStatus === "FAILED" && <Button variant="outline" size="sm" disabled={reindexingRepositoryId === item.id} onClick={() => handleReindex(item)}>{reindexingRepositoryId === item.id ? "Re-indexing..." : "Re-index"}<RefreshCw className="size-3.5" /></Button>}<Button variant="ghost" size="sm" className="text-stone-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDelete(item)}><Trash2 className="size-3.5" /> Remove</Button></CardContent></Card>)}</div>}</section>
    <section><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow mb-2">Connected GitHub</p><h2 className="text-xl font-semibold">Available repositories</h2><p className="mt-1 text-sm text-stone-500">Choose one to add it to your codebases.</p></div>{!githubConnectionNeeded && <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-3 text-stone-400" size={16} /><Input className="pl-9" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search repositories" /></div>}</div>{githubConnectionNeeded ? <EmptyState title="Connect GitHub to browse repositories" message="You can still add any public repository using the form above." /> : !isLoading && visibleRepositories.length === 0 ? <EmptyState title="All available repositories are already added" message="Remove a codebase above if you want it to appear here again." /> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visibleRepositories.map((item) => <article key={item.id} className="workspace-card flex items-center gap-3 p-4"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0f4eb]"><GitBranch className="size-4 text-[#62851d]" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.fullName}</p><p className="mt-1 truncate text-xs text-stone-500">{item.description || "No description provided."}</p></div><Button type="button" variant="outline" size="sm" disabled={isSubmitting} onClick={() => queueRepository({ owner: item.owner, repo: item.name }, item.fullName)}>{addingRepositoryFullName === item.fullName ? "Adding..." : "Use"}</Button></article>)}</div>}</section>
  </>;
}
