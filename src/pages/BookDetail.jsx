import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { coverImageUrl } from '../utils/coverImage';
import { isAssameseScript } from '../utils/scriptDetect';

const statusStyles = {
  Available: 'bg-green-100 text-green-800',
  Borrowed: 'bg-rose-100 text-rose-800',
  Pending: 'bg-amber-100 text-amber-800',
};

export default function BookDetail() {
  const { id } = useParams();
  const { books, currentUser, requestBorrow, confirmBorrow, returnBook, joinWaitlist, extendBorrow } =
    useLibrary();
  const navigate = useNavigate();
  const book = books.find((b) => b.id === id);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!book) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-amber-700 mb-4">Book not found.</p>
        <Link to="/" className="text-amber-800 underline">
          Back to Browse
        </Link>
      </div>
    );
  }

  const cover = coverImageUrl(book);
  const isOwner = book.ownerId === currentUser.id;
  const isBorrower = book.borrowerId === currentUser.id;
  const onWaitlist = book.waitlist.includes(currentUser.id);
  const isPendingByMe = book.status === 'Pending' && book.pendingUserId === currentUser.id;
  const extensionsLeft = book.maxExtensions - book.extensionCount;

  async function runAction(action) {
    setError('');
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const handleRequest = () => runAction(() => requestBorrow(book.id));
  const handleJoinWaitlist = () => runAction(() => joinWaitlist(book.id));
  const handleConfirm = () => runAction(() => confirmBorrow(book.id));
  const handleReturn = () => runAction(() => returnBook(book.id));
  const handleExtend = () => runAction(() => extendBorrow(book.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="text-amber-700 text-sm mb-6 hover:underline">
        ← Back
      </button>

      <div className="bg-white rounded-lg border border-amber-100 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row gap-8">
        <div className="w-full sm:w-48 aspect-[3/4] bg-amber-50 rounded-md overflow-hidden shrink-0">
          <img
            src={cover}
            alt={`Cover of ${book.title}`}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
              {book.genre}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[book.status] || statusStyles.Available}`}>
              {book.status}
            </span>
          </div>

          <h1 className={`text-3xl text-amber-950 ${isAssameseScript(book.title) ? 'font-assamese' : 'font-serif'}`}>
            {book.title}
          </h1>
          <p className="text-amber-700">by {book.author}</p>
          <p className="text-sm text-amber-600">Condition: {book.condition}</p>
          <p className="text-sm text-amber-600">Owned by {book.ownerName}</p>

          {book.description && <p className="text-amber-800 mt-2 leading-relaxed">{book.description}</p>}

          {book.status === 'Borrowed' && book.dueAt && (
            <p className="text-sm text-amber-700">
              Due back: <span className="font-medium">{new Date(book.dueAt).toLocaleDateString()}</span>
              {' · '}
              {book.extensionCount}/{book.maxExtensions} extensions used
            </p>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isOwner && book.status === 'Pending' && (
              <button
                onClick={handleConfirm}
                disabled={busy}
                className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
              >
                Confirm Borrow Request
              </button>
            )}

            {isOwner && book.status === 'Borrowed' && (
              <button
                onClick={handleReturn}
                disabled={busy}
                className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
              >
                Mark as Returned
              </button>
            )}

            {isOwner && book.status === 'Available' && (
              <p className="text-sm text-amber-600 italic">This is your book.</p>
            )}

            {!isOwner && book.status === 'Available' && (
              <button
                onClick={handleRequest}
                disabled={busy}
                className="bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
              >
                Request to Borrow
              </button>
            )}

            {!isOwner && isPendingByMe && (
              <p className="text-sm text-amber-700 font-medium">Request pending owner confirmation...</p>
            )}

            {!isOwner && book.status === 'Pending' && !isPendingByMe && (
              <p className="text-sm text-amber-600 italic">Someone else has requested this book.</p>
            )}

            {!isOwner && book.status === 'Borrowed' && isBorrower && (
              <>
                <p className="text-sm text-amber-700 font-medium">You currently have this book.</p>
                {extensionsLeft > 0 && book.waitlist.length === 0 ? (
                  <button
                    onClick={handleExtend}
                    disabled={busy}
                    className="bg-amber-200 hover:bg-amber-300 disabled:opacity-60 text-amber-900 font-medium px-5 py-2.5 rounded-md transition-colors"
                  >
                    Extend by 15 days (${book.extensionFee.toFixed(2)} fee)
                  </button>
                ) : (
                  <p className="text-xs text-amber-500 italic">
                    {extensionsLeft === 0
                      ? 'No extensions remaining.'
                      : 'Cannot extend — someone is waiting for this book.'}
                  </p>
                )}
              </>
            )}

            {!isOwner && book.status === 'Borrowed' && !isBorrower && (
              <button
                onClick={handleJoinWaitlist}
                disabled={onWaitlist || busy}
                className="bg-amber-200 hover:bg-amber-300 disabled:opacity-60 text-amber-900 font-medium px-5 py-2.5 rounded-md transition-colors"
              >
                {onWaitlist ? 'On Waitlist' : 'Join Waitlist'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
