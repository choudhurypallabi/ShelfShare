import { useLibrary } from '../context/LibraryContext';
import BookCard from '../components/BookCard';

export default function MyShelf() {
  const { books, currentUser } = useLibrary();

  const myListings = books.filter((b) => b.ownerId === currentUser.id);
  const myBorrows = books.filter((b) => b.borrowerId === currentUser.id);
  const myPendingRequests = books.filter(
    (b) => b.status === 'Pending' && b.pendingUserId === currentUser.id
  );
  const incomingRequests = books.filter(
    (b) => b.ownerId === currentUser.id && b.status === 'Pending'
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-serif text-3xl text-amber-950 mb-1">My Shelf</h1>
      <p className="text-amber-700 mb-8">Manage what you've lent and what you're borrowing.</p>

      {incomingRequests.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl text-amber-950 mb-3">
            Incoming Requests <span className="text-rose-600">({incomingRequests.length})</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {incomingRequests.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-serif text-xl text-amber-950 mb-3">Books I'm Lending</h2>
        {myListings.length === 0 ? (
          <p className="text-amber-600">You haven't listed any books yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {myListings.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-serif text-xl text-amber-950 mb-3">Books I'm Borrowing</h2>
        {myBorrows.length === 0 && myPendingRequests.length === 0 ? (
          <p className="text-amber-600">You aren't borrowing any books right now.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {[...myBorrows, ...myPendingRequests].map((book) => (
              <div key={book.id} className="flex flex-col gap-1.5">
                <BookCard book={book} />
                {book.dueAt && (
                  <p className="text-xs text-amber-700 px-1">
                    Due {new Date(book.dueAt).toLocaleDateString()} · {book.extensionCount}/
                    {book.maxExtensions} extensions used
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
