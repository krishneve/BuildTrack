import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'site_manager') navigate('/manager/dashboard');
      else navigate('/engineer/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with 50% Transparency */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-50 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
        style={{ backgroundImage: 'url("/login-bg.png")' }}
      />

      {/* Darkened Overlay to ensure readability */}
      <div className="absolute inset-0 z-1 bg-slate-950/80 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 px-4">
        {/* Logo Section with Enhanced Visibility */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-500 rounded-3xl mb-6 shadow-2xl shadow-amber-500/20 transform hover:scale-105 transition-transform duration-300">
            <span className="text-3xl font-black text-slate-900 tracking-tighter">BT</span>
          </div>
          
          <h1 className="text-4xl font-black !text-white tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-2">
            BuildTrack <span className="text-amber-500">AI</span>
          </h1>

          <div className="inline-block px-4 py-1.5 bg-slate-950/40 backdrop-blur-md border border-white/20 rounded-full">
            <p className="!text-white text-xs font-bold uppercase tracking-[0.2em] drop-shadow-sm">
              Samarth Developers, Nashik
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="you@samarthdevelopers.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-slate-900 font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs !text-slate-400 mt-8 font-medium drop-shadow-sm">
          BuildTrack AI v1.0 · Samarth Developers Internal System
        </p>
      </div>
    </div>
  );
}
