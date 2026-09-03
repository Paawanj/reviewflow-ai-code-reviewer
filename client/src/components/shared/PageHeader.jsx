export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-stone-200/80 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">ReviewFlow workspace</p>
        <h1 className="page-title mt-2">{title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-500">{description}</p>
      </div>
      {action}
    </div>
  );
}
