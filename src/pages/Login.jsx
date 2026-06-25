import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await signUp(form.email, form.password, form.name);
      } else {
        await signIn(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display text-4xl text-[#faf8f3] drop-shadow-[0_1px_4px_rgba(0,0,0,0.4)] mb-6 text-center">
        ShelfShare
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-amber-100 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              mode === 'signin' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-md text-sm font-medium ${
              mode === 'signup' ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-900'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="text-rose-600 text-sm">{error}</p>}

        {mode === 'signup' && (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-amber-900">Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </label>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Email</span>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-amber-900">Password</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="px-3 py-2 rounded-md border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white font-medium py-2.5 rounded-md transition-colors"
        >
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
