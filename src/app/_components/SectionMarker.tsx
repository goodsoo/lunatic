export function SectionMarker({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="mb-12 font-body text-xs uppercase tracking-widest text-text-3 md:mb-16">
      ({number}) {label}
    </div>
  );
}
