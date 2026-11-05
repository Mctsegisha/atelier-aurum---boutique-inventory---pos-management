import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowRight, Lock, User } from 'lucide-react';

export function LoginView() {
  const { login, isLoading } = useAuth();
  const [credential, setCredential] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(credential, password);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center items-center p-6 selection:bg-[#B89B65]/20">
      <div className="max-w-md w-full space-y-8">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <span className="text-[10px] tracking-[0.25em] uppercase text-[#B89B65] font-semibold block">
            Boutique Inventory & POS Management
          </span>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1A1A1A]">
            Hirbit Store
          </h1>
          <p className="text-xs text-[#716D66] max-w-sm mx-auto">
            Hawassa Piyassa Mall, 1st Floor · Authorized Personnel Terminal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E5E0D8] p-8 shadow-xs space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#59554F] font-medium mb-1">Email or Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="admin@hirbitstore.com or username"
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                  className="w-full p-2.5 pl-9 border border-[#E5E0D8] rounded-md focus:outline-none focus:border-[#B89B65] transition-colors"
                />
                <User className="w-4 h-4 text-[#8C8275] absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[#59554F] font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-2.5 pl-9 border border-[#E5E0D8] rounded-md focus:outline-none focus:border-[#B89B65] transition-colors"
                />
                <Lock className="w-4 h-4 text-[#8C8275] absolute left-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#B89B65] text-white rounded-md font-medium uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Terminal'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        <p className="text-[11px] text-center text-[#8C8275]">
          Hirbit Store &copy; 2026. Hawassa, Ethiopia. Powered by Neon PostgreSQL.
        </p>
      </div>
    </div>
  );
}
