import { readingQuotes } from '../data/quotes';

export default function QuoteSidebar() {
  return (
    <aside className="hidden sm:flex flex-col gap-6 w-56 md:w-64 shrink-0 pt-2">
      {readingQuotes.map((q, i) => (
        <blockquote key={i}>
          <p className="font-display italic text-[#faf8f3] text-lg leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            “{q.text}”
          </p>
          <footer className="mt-1 text-xs uppercase tracking-wide font-semibold text-[#faf8f3] drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            — {q.author}
          </footer>
        </blockquote>
      ))}
    </aside>
  );
}
