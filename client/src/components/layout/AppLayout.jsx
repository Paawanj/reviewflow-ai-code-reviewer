import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="app-shell min-h-screen text-slate-950 md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 p-5 sm:p-7 lg:p-10">
        <div className="mx-auto max-w-[88rem]"><Outlet /></div>
      </main>
    </div>
  );
}
