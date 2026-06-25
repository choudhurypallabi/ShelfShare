import { NavLink } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    isActive ? 'bg-amber-700 text-white' : 'text-amber-900 hover:bg-amber-100'
  }`;

export default function Navbar() {
  const { pendingCount } = useLibrary();
  const { signOut } = useAuth();

  return (
    <nav className="bg-[#e0f2f1] border-b border-teal-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">📚</span>
          <span className="font-serif text-xl text-amber-900 tracking-tight">ShelfShare</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          <NavLink to="/" className={linkClass} end>
            Browse
          </NavLink>
          <NavLink to="/add" className={linkClass}>
            Add Book
          </NavLink>
          <NavLink to="/shelf" className={linkClass}>
            <span className="relative inline-flex items-center">
              My Shelf
              {pendingCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-rose-600 text-white text-[10px] leading-none rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </span>
          </NavLink>
          <button
            onClick={signOut}
            className="px-3 py-2 rounded-md text-sm font-medium text-amber-900 hover:bg-amber-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}
