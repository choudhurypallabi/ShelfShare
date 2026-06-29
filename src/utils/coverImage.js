export function coverImageUrl(book) {
  if (book.coverUrl) return book.coverUrl;
  return `https://picsum.photos/seed/${encodeURIComponent(book.id)}/300/400`;
}
