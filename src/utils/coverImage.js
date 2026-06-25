export function coverImageUrl(book) {
  return `https://picsum.photos/seed/${encodeURIComponent(book.id)}/300/400`;
}

const coverCache = new Map();

export async function fetchRealCover(book) {
  if (coverCache.has(book.id)) return coverCache.get(book.id);

  try {
    const params = new URLSearchParams({
      title: book.title,
      author: book.author,
      limit: '1',
      fields: 'cover_i',
    });
    const res = await fetch(`https://openlibrary.org/search.json?${params}`);
    const data = await res.json();
    const coverId = data.docs?.[0]?.cover_i;
    const url = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
    coverCache.set(book.id, url);
    return url;
  } catch {
    coverCache.set(book.id, null);
    return null;
  }
}
