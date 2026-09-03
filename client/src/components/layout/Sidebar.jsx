import {
  FolderGit2,
  GitPullRequest,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const links = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/repositories",
    label: "Repositories",
    icon: FolderGit2,
  },
  {
    to: "/pull-requests",
    label: "Pull Requests",
    icon: GitPullRequest,
  },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="border-b border-white/5 bg-[#11140f] text-slate-100 md:sticky md:top-0 md:flex md:h-screen md:w-[19rem] md:flex-col md:border-b-0 md:border-r">
      <div className="flex items-center justify-between p-4 md:block md:p-5">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-3 font-semibold tracking-tight"
        >
          <span className="rounded-2xl bg-[#b8f250] p-2.5 text-[#11140f] shadow-[0_0_0_6px_rgba(184,242,80,.09)]">
            <Sparkles className="size-4" />
          </span>
          <span>
            <span className="block text-base text-white">ReviewFlow</span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[.18em] text-stone-500">Review workspace</span>
          </span>
        </NavLink>

        <Button
          className="text-slate-100 hover:bg-slate-800 hover:text-white md:hidden"
          variant="ghost"
          size="icon"
          aria-label="Toggle navigation"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      <nav
        className={`${
          isOpen ? "block" : "hidden"
        } space-y-1 px-3 pb-4 md:block md:px-4 md:pt-8`}
      >
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-stone-500">Workspace</p>
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.05)]"
                  : "text-stone-400 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Signed-in user and logout */}
      <div className="border-t border-white/10 p-4 md:mt-auto md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#2a2d26] text-xs font-bold text-[#b8f250]">
            {(user?.name || user?.email || "R").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">
            {user?.name || user?.email}
            </p>
            <p className="truncate text-xs text-stone-500">GitHub review workspace</p>
          </div>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 rounded-xl text-stone-400 hover:bg-white/5 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="size-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
