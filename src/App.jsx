import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider } from './context/LibraryContext';
import Navbar from './components/Navbar';
import Browse from './pages/Browse';
import AddBook from './pages/AddBook';
import BookDetail from './pages/BookDetail';
import MyShelf from './pages/MyShelf';
import Login from './pages/Login';

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
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
