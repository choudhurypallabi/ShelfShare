import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const LibraryContext = createContext(null);

const DAY_MS = 24 * 60 * 60 * 1000;
const LOAN_DAYS = 15;
const MAX_EXTENSIONS = 3;
const EXTENSION_FEE = 2.0;

function buildBooksView(books, borrows, waitlistRows, profilesById) {
  return books.map((book) => {
    const owner = profilesById.get(book.owner_id);
    const activeBorrow = borrows.find((b) => b.book_id === book.id && b.status !== 'returned');
    const waitlist = waitlistRows.filter((w) => w.book_id === book.id).map((w) => w.user_id);

    return {
      id: book.id,
      title: book.title,
      author: book.author,
      genre: book.genre,
      condition: book.condition,
      description: book.description,
      status: book.status,
      coverUrl: book.cover_url,
      ownerId: book.owner_id,
      ownerName: owner?.name ?? 'Unknown',
      borrowId: activeBorrow?.id ?? null,
      borrowerId: activeBorrow?.status === 'active' ? activeBorrow.borrower_id : null,
      pendingUserId: activeBorrow?.status === 'pending' ? activeBorrow.borrower_id : null,
      dueAt: activeBorrow?.due_at ?? null,
      extensionCount: activeBorrow?.extension_count ?? 0,
      maxExtensions: MAX_EXTENSIONS,
      extensionFee: EXTENSION_FEE,
      waitlist,
    };
  });
}

export function LibraryProvider({ children }) {
  const { user, profile } = useAuth();
  const [raw, setRaw] = useState({ books: [], borrows: [], waitlist: [], profiles: [] });
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const [booksRes, borrowsRes, waitlistRes, profilesRes] = await Promise.all([
      supabase.from('books').select('*').order('created_at', { ascending: false }),
      supabase.from('borrows').select('*').neq('status', 'returned'),
      supabase.from('waitlist').select('*'),
      supabase.from('profiles').select('*'),
    ]);
    setRaw({
      books: booksRes.data ?? [],
      borrows: borrowsRes.data ?? [],
      waitlist: waitlistRes.data ?? [],
      profiles: profilesRes.data ?? [],
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    refetch();

    const channel = supabase
      .channel('shelfshare-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'borrows' }, refetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist' }, refetch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const profilesById = useMemo(() => new Map(raw.profiles.map((p) => [p.id, p])), [raw.profiles]);
  const books = useMemo(
    () => buildBooksView(raw.books, raw.borrows, raw.waitlist, profilesById),
    [raw, profilesById]
  );

  const currentUser = useMemo(
    () => (user ? { id: user.id, name: profile?.name ?? user.email } : null),
    [user, profile]
  );

  const pendingCount = currentUser
    ? books.filter((b) => b.status === 'Pending' && b.ownerId === currentUser.id).length
    : 0;

  async function addBook(payload) {
    const { error } = await supabase.from('books').insert({
      title: payload.title,
      author: payload.author,
      genre: payload.genre,
      condition: payload.condition,
      description: payload.description || null,
      cover_url: payload.coverUrl || null,
      owner_id: currentUser.id,
      status: 'Available',
    });
    if (error) throw error;
    await refetch();
  }

  async function requestBorrow(bookId) {
    const { error: borrowError } = await supabase
      .from('borrows')
      .insert({ book_id: bookId, borrower_id: currentUser.id, status: 'pending' });
    if (borrowError) throw borrowError;

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'Pending' })
      .eq('id', bookId);
    if (bookError) throw bookError;
    await refetch();
  }

  async function confirmBorrow(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book?.borrowId) return;

    const dueAt = new Date(Date.now() + LOAN_DAYS * DAY_MS).toISOString();

    const { error: borrowError } = await supabase
      .from('borrows')
      .update({ status: 'active', borrowed_at: new Date().toISOString(), due_at: dueAt })
      .eq('id', book.borrowId);
    if (borrowError) throw borrowError;

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'Borrowed' })
      .eq('id', bookId);
    if (bookError) throw bookError;
    await refetch();
  }

  async function extendBorrow(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book?.borrowId) return;
    if (book.extensionCount >= MAX_EXTENSIONS) {
      throw new Error(`You've used all ${MAX_EXTENSIONS} extensions for this book.`);
    }
    if (book.waitlist.length > 0) {
      throw new Error('This book has a waitlist, so it cannot be extended.');
    }

    const previousDueAt = book.dueAt ?? new Date().toISOString();
    const newDueAt = new Date(new Date(previousDueAt).getTime() + LOAN_DAYS * DAY_MS).toISOString();

    const { error: extensionError } = await supabase.from('extensions').insert({
      borrow_id: book.borrowId,
      previous_due_at: previousDueAt,
      new_due_at: newDueAt,
      fee_amount: EXTENSION_FEE,
      fee_paid: false,
    });
    if (extensionError) throw extensionError;

    const { error: borrowError } = await supabase
      .from('borrows')
      .update({ due_at: newDueAt, extension_count: book.extensionCount + 1 })
      .eq('id', book.borrowId);
    if (borrowError) throw borrowError;
    await refetch();
  }

  async function returnBook(bookId) {
    const book = books.find((b) => b.id === bookId);
    if (!book?.borrowId) return;

    const { error: borrowError } = await supabase
      .from('borrows')
      .update({ status: 'returned', returned_at: new Date().toISOString() })
      .eq('id', book.borrowId);
    if (borrowError) throw borrowError;

    const { error: bookError } = await supabase
      .from('books')
      .update({ status: 'Available' })
      .eq('id', bookId);
    if (bookError) throw bookError;
    await refetch();
  }

  async function joinWaitlist(bookId) {
    const { error } = await supabase
      .from('waitlist')
      .upsert({ book_id: bookId, user_id: currentUser.id }, { onConflict: 'book_id,user_id' });
    if (error) throw error;
    await refetch();
  }

  return (
    <LibraryContext.Provider
      value={{
        books,
        loading,
        currentUser,
        pendingCount,
        addBook,
        requestBorrow,
        confirmBorrow,
        extendBorrow,
        returnBook,
        joinWaitlist,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
