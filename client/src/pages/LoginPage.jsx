import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import { Mail, Lock, Shield } from 'lucide-react';
import { useToast } from '../components/common/Toast.jsx';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuthStore();
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(email, password, rememberMe);
    if (res.success) {
      addToast('Welcome back, Administrator!', 'success');
      navigate('/dashboard');
    } else {
      addToast(res.error || 'Authentication failed', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/50 via-slate-50 to-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background ambient gold luxury glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#D4AF37]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Login Box */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xl shadow-slate-200/50 relative z-10">
        {/* Brand Lockup */}
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="TIA'Z Logo"
            className="w-16 h-16 object-contain mx-auto mb-3 rounded-full shadow-md border border-amber-300/40 bg-amber-50/20"
          />
          <h1 className="text-2xl font-black text-slate-900 font-serif tracking-wide">
            TIA'Z <span className="text-[#D4AF37]">GOLD</span>
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mt-1">
            Enterprise Admin & Custody Desk
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Admin Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@tiaz.com"
            icon={Mail}
            required
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            icon={Lock}
            required
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-white border-slate-300 text-[#D4AF37] focus:ring-[#D4AF37] cursor-pointer"
              />
              <span>Remember session</span>
            </label>
            <button
              type="button"
              onClick={() => addToast('Please contact master security officer to reset admin token.', 'info')}
              className="text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full mt-2"
          >
            Authenticate & Access Console
          </Button>
        </form>

        {/* Footer info */}
        <div className="mt-8 pt-5 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
            256-Bit SSL Encrypted Admin Portal
          </p>
        </div>
      </div>
    </div>
  );
}
