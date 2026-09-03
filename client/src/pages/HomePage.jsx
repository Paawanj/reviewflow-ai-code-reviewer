import { ArrowRight, ArrowUpRight, Check, Code2, GitPullRequest, Network, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import StrokeText from "@/components/effects/StrokeText";
import LightRays from "@/components/effects/LightRays";
import HalftoneReveal from "@/components/effects/HalftoneReveal";
import heroImage from "@/assets/hero.png";

const proof = ["GitHub pull requests", "Repository-aware feedback", "Saved decision trail"];
const steps = [
  ["01", GitPullRequest, "Pick the change", "Open the pull request that needs another set of careful eyes."],
  ["02", Network, "Connect the dots", "Bring relevant code from across the repository into the review."],
  ["03", ShieldCheck, "Ship with clarity", "Turn findings into a more confident merge decision."],
];

export default function HomePage() {
  return <main className="min-h-screen overflow-hidden bg-[#0d0f0c] text-stone-100 selection:bg-[#c7fb5a] selection:text-[#10130e]">
    <section className="relative isolate min-h-screen overflow-hidden border-b border-white/10">
      <LightRays />
      <div className="dark-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <nav className="flex h-20 items-center justify-between border-b border-white/10"><Link to="/" className="group flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#c7fb5a] text-[#10130e] shadow-[0_0_0_5px_rgba(199,251,90,.08)] transition-transform duration-300 group-hover:rotate-12"><Sparkles className="size-4" /></span><span><span className="block font-semibold tracking-[-.04em] text-white">ReviewFlow</span><span className="block text-[9px] font-medium uppercase tracking-[.18em] text-stone-500">Code review, considered</span></span></Link><span className="hidden text-[10px] font-semibold uppercase tracking-[.2em] text-stone-500 sm:block">Powered by your GitHub workspace</span></nav>

        <div className="grid gap-12 pb-16 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:pb-20 lg:pt-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65, ease: [.22, 1, .36, 1] }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#c7fb5a]/25 bg-[#c7fb5a]/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[.14em] text-[#dcff9c]"><span className="size-1.5 animate-pulse rounded-full bg-[#c7fb5a]" /> The review room for every PR</p>
            <h1 className="mt-7 max-w-3xl"><span className="block text-5xl font-semibold leading-[.87] tracking-[-.075em] text-white sm:text-6xl lg:text-7xl">See more.</span><StrokeText text="Ship better." delay={.15} className="mt-1 max-w-[680px]" /></h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-stone-400 sm:text-lg">ReviewFlow puts the pull request, the relevant code, and the decision trail in one focused place—so feedback has context and every merge has a reason.</p>
            <div className="mt-9"><Link to="/login" className="group relative inline-flex h-13 items-center gap-3 overflow-hidden rounded-2xl bg-[#c7fb5a] px-5 text-sm font-bold text-[#11130e] shadow-[0_12px_36px_rgba(199,251,90,.18)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(199,251,90,.28)]"><span className="absolute inset-0 -translate-x-full bg-white/45 transition-transform duration-500 group-hover:translate-x-full" /> <span className="relative">Start reviewing</span><span className="relative grid size-7 place-items-center rounded-lg bg-[#10130e] text-[#c7fb5a] transition-transform duration-300 group-hover:translate-x-1"><ArrowRight className="size-4" /></span></Link></div>
            <div className="mt-9 flex flex-wrap gap-x-5 gap-y-3 text-xs text-stone-400">{proof.map((item) => <span key={item} className="flex items-center gap-2"><Check className="size-3.5 text-[#c7fb5a]" />{item}</span>)}</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 28, rotate: 2 }} animate={{ opacity: 1, x: 0, rotate: 0 }} transition={{ duration: .8, delay: .15, type: "spring", stiffness: 65 }} className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-6 rounded-full bg-[#c7fb5a]/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/15 bg-[#171a14] p-3 shadow-[0_30px_80px_rgba(0,0,0,.48)]">
              <div className="flex items-center justify-between border-b border-white/10 px-2 pb-3"><div className="flex gap-1.5"><i className="size-2 rounded-full bg-[#ff6b6b]" /><i className="size-2 rounded-full bg-[#ffd166]" /><i className="size-2 rounded-full bg-[#c7fb5a]" /></div><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-stone-500">Pull request / 042</span></div>
              <div className="grid gap-3 p-2 pt-5 sm:grid-cols-[.82fr_1.18fr]"><HalftoneReveal src={heroImage} alt="ReviewFlow code review workspace" className="min-h-52 rounded-2xl" /><div className="rounded-2xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-stone-500">Review ready</p><h2 className="mt-2 text-base font-semibold tracking-[-.03em] text-white">Add ownership checks</h2></div><span className="rounded-full bg-[#c7fb5a]/15 px-2 py-1 text-[10px] font-bold text-[#dcff9c]">8.6</span></div><div className="mt-5 border-l border-[#c7fb5a]/50 pl-3"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#c7fb5a]">One thing to review</p><p className="mt-2 text-xs leading-5 text-stone-300">Validate requested review ownership before returning a saved record.</p></div><div className="mt-5 flex items-center gap-2 text-[11px] text-stone-500"><Code2 className="size-3.5 text-[#c7fb5a]" /> requireUser.js · 0.82 match</div></div></div>
            </div>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -bottom-5 -left-5 hidden rounded-xl border border-white/10 bg-[#20241c] px-3 py-2 shadow-xl sm:flex sm:items-center sm:gap-2"><span className="grid size-6 place-items-center rounded-lg bg-[#c7fb5a]/15 text-[#c7fb5a]"><GitPullRequest className="size-3.5" /></span><span><span className="block text-[10px] font-semibold text-white">Review in context</span><span className="block text-[9px] text-stone-500">Not just a diff</span></span></motion.div>
          </motion.div>
        </div>
      </div>
    </section>

    <section className="relative bg-[#f3f3ed] text-[#11130e]"><div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#60811e]">A better way to look at changes</p><h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-.055em] sm:text-5xl">Less hunting. Better questions. Clearer decisions.</h2></div><p className="max-w-sm text-sm leading-6 text-stone-600">A deliberate workflow for the moments right before you merge: what changed, what connects to it, and what needs a second look.</p></div><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-stone-300 bg-stone-300 md:grid-cols-3">{steps.map(([number, Icon, title, description]) => <article key={number} className="group bg-[#f3f3ed] p-6 transition-colors hover:bg-[#e8f3d3]"><div className="flex items-start justify-between"><span className="text-xs font-semibold text-stone-400">{number}</span><span className="grid size-9 place-items-center rounded-xl bg-[#11130e] text-[#c7fb5a] transition-transform group-hover:rotate-6"><Icon className="size-4" /></span></div><h3 className="mt-14 text-xl font-semibold tracking-[-.04em]">{title}</h3><p className="mt-3 max-w-xs text-sm leading-6 text-stone-600">{description}</p></article>)}</div><Link to="/login" className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-[#11130e] hover:underline">Open your GitHub workspace <ArrowUpRight className="size-4" /></Link></div></section>
  </main>;
}
