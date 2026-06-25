import { useEffect, useState } from 'react';
import { coverImageUrl, fetchRealCover } from './coverImage';

export function useBookCover(book) {
  const [src, setSrc] = useState(coverImageUrl(book));

  useEffect(() => {
    let active = true;
    setSrc(coverImageUrl(book));
    fetchRealCover(book).then((url) => {
      if (active && url) setSrc(url);
    });
    return () => {
      active = false;
    };
  }, [book.id]);

  return src;
}
