import { Link } from 'react-router-dom';
import { useBookCover } from '../utils/useBookCover';
import { isAssameseScript } from '../utils/scriptDetect';

const statusStyles = {
  Available: 'bg-green-100 text-green-800',
  Borrowed: 'bg-rose-100 text-rose-800',
  Pending: 'bg-amber-100 text-amber-800',
};

export default function BookCard({ book, compact = false }) {
  const cover = useBookCover(book);

  return (
    <Link
      to={`/book/${book.id}`}
      className="bg-white rounded-lg shadow-sm border border-amber-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="aspect-[3/4] bg-amber-50">
        <img
          src={cover}
          alt={`Cover of ${book.title}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className={`flex flex-col gap-1.5 flex-1 ${compact ? 'p-2.5' : 'p-4'}`}>
        <h3
          className={`text-amber-950 leading-snug ${compact ? 'text-sm' : 'text-lg'} ${
            isAssameseScript(book.title) ? 'font-assamese' : 'font-serif'
          }`}
        >
          {book.title}
        </h3>
        <p className={`text-amber-700 ${compact ? 'text-xs' : 'text-sm'}`}>{book.author}</p>
        <div className="flex items-center justify-between mt-auto pt-1.5 gap-1 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium ${
              compact ? 'text-[10px]' : 'text-xs'
            }`}
          >
            {book.genre}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-medium ${statusStyles[book.status] || statusStyles.Available} ${
              compact ? 'text-[10px]' : 'text-xs'
            }`}
          >
            {book.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
