import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import { isSupabaseConfigured } from './lib/supabaseClient';
import Navbar from './components/Navbar';
import Browse from './pages/Browse';
import AddBook from './pages/AddBook';
import BookDetail from './pages/BookDetail';
import MyShelf from './pages/MyShelf';
import Login from './pages/Login';

function SetupRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md bg-white rounded-lg border border-amber-100 shadow-sm p-6 text-center">
        <h1 className="font-display text-2xl text-amber-950 mb-2">Connect Supabase to continue</h1>
        <p className="text-sm text-amber-700 mb-4">
          This app needs a Supabase project before it can run. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, fill in your project's URL and anon key, then restart the dev server.
          Full steps are in <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-amber-700">Loading...</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <LibraryProvider>
              <div className="min-h-screen font-sans">
                <Navbar />
                <Routes>
                  <Route path="/" element={<Browse />} />
                  <Route path="/add" element={<AddBook />} />
                  <Route path="/book/:id" element={<BookDetail />} />
                  <Route path="/shelf" element={<MyShelf />} />
                </Routes>
              </div>
            </LibraryProvider>
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function App() {
  if (!isSupabaseConfigured) return <SetupRequired />;

  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
