import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';

const GENRES = ['Fantasy', 'Sci-Fi', 'Memoir', 'Thriller', 'Self-Help', 'History', 'Romance', 'Mystery', 'Biography', 'Other'];

export default function AddBook() {
  const { addBook } = useLibrary();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: GENRES[0],
    condition: 'Good',
    description: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.');
      return;
    }
    setSubmitting(true);
    try {
      await addBook(form);
      navigate('/shelf');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-3xl text-amber-950 mb-1">Add a Book</h1>
      <p className="text-amber-700 mb-6">List a book you'd like to lend to the community.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-amber-100 shadow-sm p-6 flex flex-col gap-4">
        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Title</span>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. The Midnight Library"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Author</span>
          <input
            name="author"
            value={form.author}
            onChange={handleChange}
            className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="e.g. Matt Haig"
          />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium text-amber-900">Genre</span>
            <select
              name="genre"
              value={form.genre}
              onChange={handleChange}
              className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 flex-1">
            <span className="text-sm font-medium text-amber-900">Condition</span>
            <select
              name="condition"
              value={form.condition}
              onChange={handleChange}
              className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Description (optional)</span>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            placeholder="A short note about the book..."
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-md transition-colors"
        >
          {submitting ? 'Listing...' : 'List Book'}
        </button>
      </form>
    </div>
  );
}
