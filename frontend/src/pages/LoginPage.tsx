import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('vipul');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/select-mode');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
        {/* Header branding */}
        <div className="bg-stone-900 px-8 py-10 text-center relative">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4">
            <Droplets className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">VIPUL MILK</h1>
          <p className="text-stone-300 text-sm mt-1">Dairy Management & Billing Portal</p>
        </div>

        {/* Login form */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-stone-900">Owner Sign In</h2>
            <p className="text-sm text-stone-500 mt-1">Enter your dairy credentials to access daily records.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-stone-900 font-medium text-base min-h-[48px]"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-stone-50 border border-stone-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-stone-900 font-medium text-base min-h-[48px]"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition duration-150 flex items-center justify-center min-h-[48px] text-base disabled:opacity-50 cursor-pointer mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dairy System'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <p className="text-xs text-stone-400 font-medium">
              Vipul Milk Secure Billing System &bull; Single-Operator Mode
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

