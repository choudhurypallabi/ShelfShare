import Tesseract from 'tesseract.js';

const GENRES = ['Fantasy', 'Sci-Fi', 'Memoir', 'Thriller', 'Self-Help', 'History', 'Romance', 'Mystery', 'Biography', 'Other'];

const GENRE_KEYWORDS = {
  Fantasy: ['fantasy', 'magic', 'fairy'],
  'Sci-Fi': ['science fiction', 'sci-fi', 'space'],
  Memoir: ['memoir', 'autobiography'],
  Thriller: ['thriller', 'suspense', 'crime'],
  'Self-Help': ['self-help', 'self help', 'personal growth', 'motivational', 'success'],
  History: ['history', 'historical'],
  Romance: ['romance', 'love stories'],
  Mystery: ['mystery', 'detective'],
  Biography: ['biography'],
};

function mapGenre(subjects) {
  const text = (subjects ?? []).join(' ').toLowerCase();
  for (const genre of GENRES) {
    if ((GENRE_KEYWORDS[genre] ?? []).some((kw) => text.includes(kw))) return genre;
  }
  return 'Other';
}

// Reads the text printed on a book-cover photo via OCR, then looks it up
// on Open Library to get the canonical title/author/genre. OCR output is
// noisy, so the search ORs the words together and relies on relevance
// ranking to surface the right book above the junk matches.
// Returns { title, author, genre } or null when nothing usable was found.
export async function extractBookDetails(file) {
  const { data } = await Tesseract.recognize(file, 'eng');

  const words = [...new Set(
    data.text
      .split(/[^A-Za-z]+/)
      .filter((w) => w.length >= 4)
      .map((w) => w.toLowerCase())
  )].slice(0, 15);
  if (words.length === 0) return null;

  const params = new URLSearchParams({
    q: words.join(' OR '),
    limit: '1',
    fields: 'title,author_name,subject',
  });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`);
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json.docs?.[0];
  if (!doc?.title) return null;

  return {
    title: doc.title,
    author: doc.author_name?.[0] ?? '',
    genre: mapGenre(doc.subject),
  };
}
