import { useMemo, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import BookCard from '../components/BookCard';
import QuoteSidebar from '../components/QuoteSidebar';

export default function Browse() {
  const { books } = useLibrary();
  const [query, setQuery] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);

  const genres = useMemo(
    () => Array.from(new Set(books.map((b) => b.genre))).sort(),
    [books]
  );

  function toggleGenre(genre) {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((b) => {
      const matchesQuery =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q);
      const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(b.genre);
      return matchesQuery && matchesGenre;
    });
  }, [books, query, selectedGenres]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <p className="font-accent italic text-xl text-[#faf8f3] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] mb-6">
        Read More. Own Less.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="text"
          placeholder="Search by title, author, or genre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-950"
        />
        <details className="relative group">
          <summary className="list-none cursor-pointer px-4 py-2 rounded-md border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 text-amber-950 flex items-center gap-2 select-none">
            Genres
            {selectedGenres.length > 0 && (
              <span className="text-xs bg-amber-700 text-white rounded-full w-5 h-5 flex items-center justify-center">
                {selectedGenres.length}
              </span>
            )}
            <span className="text-amber-500">▾</span>
          </summary>
          <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white border border-amber-200 rounded-md shadow-lg p-3 flex flex-col gap-2 z-20">
            {selectedGenres.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedGenres([])}
                className="text-xs text-amber-700 underline self-start mb-1"
              >
                Clear all
              </button>
            )}
            {genres.map((g) => (
              <label key={g} className="flex items-center gap-2 text-sm text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGenres.includes(g)}
                  onChange={() => toggleGenre(g)}
                  className="accent-amber-700"
                />
                {g}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="flex gap-10">
        <QuoteSidebar />

        {filtered.length === 0 ? (
          <p className="text-amber-600 text-center py-16 flex-1">No books match your search.</p>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,140px)] gap-4 flex-1 content-start">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} compact />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
