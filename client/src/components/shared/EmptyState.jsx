export default function EmptyState({ title, message }) {
  return (
    <div className="app-panel border-dashed p-10 text-center">
      <h2 className="font-semibold tracking-[-.02em] text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">{message}</p>
    </div>
  );
}
