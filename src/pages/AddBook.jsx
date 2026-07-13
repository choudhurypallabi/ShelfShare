import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { uploadBookCover } from '../utils/uploadCover';
import { extractBookDetails } from '../utils/bookLookup';
import CameraCapture from '../components/CameraCapture';

const GENRES = ['Fantasy', 'Sci-Fi', 'Memoir', 'Thriller', 'Self-Help', 'History', 'Romance', 'Mystery', 'Biography', 'Other'];

export default function AddBook() {
  const { addBook, currentUser } = useLibrary();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: GENRES[0],
    condition: 'Good',
    description: '',
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function listBook(values, photoFile) {
    setSubmitting(true);
    setError('');
    try {
      let coverUrl = null;
      if (photoFile) {
        coverUrl = await uploadBookCover(photoFile, currentUser.id);
      }
      await addBook({ ...values, coverUrl });
      navigate('/shelf');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // OCR the photo and look the text up on Google Books. If we get a
  // confident title + author, list the book immediately; otherwise
  // pre-fill whatever was found and let the user finish the form.
  async function detectAndAdd(file) {
    setDetecting(true);
    setError('');
    try {
      const details = await extractBookDetails(file);
      if (details?.title && details?.author) {
        const values = {
          ...form,
          title: details.title,
          author: details.author,
          genre: details.genre,
          condition: 'Good',
        };
        setForm(values);
        await listBook(values, file);
        return;
      }
      if (details?.title) {
        setForm((f) => ({ ...f, title: details.title, genre: details.genre, condition: 'Good' }));
      }
      setError('Could not read all details from the photo — please fill in the rest and click List Book.');
    } catch {
      setError('Could not detect book details from the photo — please fill the form manually.');
    } finally {
      setDetecting(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) {
      setPhoto(null);
      setPhotoPreview(null);
      return;
    }
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    detectAndAdd(file);
  }

  function handleCameraCapture(file) {
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
    setShowCamera(false);
    detectAndAdd(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      setError('Title and author are required.');
      return;
    }
    await listBook(form, photo);
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-3xl text-amber-950 mb-1">Add a Book</h1>
      <p className="text-amber-700 mb-6">List a book you'd like to lend to the community.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-amber-100 shadow-sm p-6 flex flex-col gap-4">
        {error && <p className="text-rose-600 text-sm">{error}</p>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Book Photo (optional)</span>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Selected book cover preview"
              className="w-32 aspect-[3/4] object-cover rounded-md border border-amber-200 mb-1"
            />
          )}
          {showCamera ? (
            <CameraCapture onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="text-sm text-amber-900 file:mr-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-amber-100 file:text-amber-900 file:font-medium"
              />
              <button
                type="button"
                onClick={() => setShowCamera(true)}
                className="text-sm font-medium px-3 py-2 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
              >
                📷 Take Photo
              </button>
            </div>
          )}
          <span className="text-xs text-amber-600">
            Snap or choose a cover photo and we'll read the title, author, and genre from it and
            list the book automatically. You can also fill the form manually.
          </span>
          {detecting && (
            <span className="text-sm text-amber-700 font-medium animate-pulse">
              Reading book details from photo...
            </span>
          )}
        </label>

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
          disabled={submitting || detecting}
          className="mt-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-md transition-colors"
        >
          {submitting ? (photo ? 'Uploading photo...' : 'Listing...') : 'List Book'}
        </button>
      </form>
    </div>
  );
}
