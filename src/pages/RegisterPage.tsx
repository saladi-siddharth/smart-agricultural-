import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sprout, Eye, EyeOff, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { showToast } from '@/components/common/ToastNotification';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName);
      showToast.success('Account created successfully! Welcome to FarmPilot.');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FBFBFA]">
      {/* Left — Botanical Luxury Hero Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#143D30] text-white relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="reg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#reg-grid)" />
          </svg>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
            <Sprout className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">FarmPilot</span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-emerald-300">Phase 1 Agronomic OS</span>
          </div>
        </div>

        {/* Main Brand Narrative */}
        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-emerald-300 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Precision Agriculture Management System
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight text-white tracking-tight">
            Start Managing Your Farm With Mathematical Clarity.
          </h2>

          <p className="text-sm text-white/70 leading-relaxed">
            Eliminate operational guesswork. Plan crop cycles, track real-time resource outlays, and preserve peak biological health.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Farm Health Index', value: '4-Pillar Algorithmic Score' },
              { label: 'Agronomic Insights', value: 'Explainable Rationale Engine' },
              { label: 'Financial Matrix', value: 'Live Outlay vs Revenue ROI' },
              { label: 'Field Demarcation', value: 'Soil & Irrigation Ledger' },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs font-bold text-white">{item.label}</p>
                <p className="text-[10px] text-white/60 mt-0.5">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/50 pt-6 border-t border-white/10">
          <span>Enterprise Agricultural SaaS</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Supabase RLS Protected
          </span>
        </div>
      </div>

      {/* Right — Clean Light Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-[#143D30] rounded-xl flex items-center justify-center text-white">
              <Sprout className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-lg font-bold text-[#0F172A]">FarmPilot</span>
          </div>

          <div className="bg-white rounded-xl p-8 border border-[#E5E8EB] shadow-xs">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Create your account</h1>
              <p className="text-xs text-[#64748B] mt-1">
                Configure your agricultural holding in seconds
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@domain.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#143D30] focus:border-[#143D30] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#143D30] hover:bg-[#1A4D3E] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-[#64748B]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#143D30] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
