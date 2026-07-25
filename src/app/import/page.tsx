import { JsonImporter } from "@/components/import/JsonImporter";

export default function ImportPage() {
  return (
    <div className="flex-1 px-6 py-8 sm:px-10">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--gold)]">
          Data pipeline
        </p>
        <h1 className="mt-1 font-display text-[2rem] font-semibold tracking-tight">
          Import design data
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[var(--muted)]">
          Pull from OpenSolar exports and render a proposal that looks closer to Enerflo than
          the default PDF.
        </p>
      </header>
      <div className="mt-10">
        <JsonImporter />
      </div>
    </div>
  );
}
