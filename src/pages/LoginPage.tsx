import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sprout, Eye, EyeOff, ArrowRight, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { showToast } from '@/components/common/ToastNotification';

export default function LoginPage() {
  const { signIn, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      showToast.success('Signed in successfully');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
      showToast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    try {
      await signInDemo();
      showToast.success('Welcome to Green Valley Demo Farm!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Demo sign in failed';
      setError(msg);
      showToast.error(msg);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#FBFBFA]">
      {/* Left — Botanical Luxury Hero Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#143D30] text-white relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
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
            National Hackathon Precision Agriculture Platform
          </div>

          <h2 className="text-3xl lg:text-4xl font-bold leading-tight text-white tracking-tight">
            See what's happening.<br />
            Understand what it means.<br />
            Act on what matters.
          </h2>

          <p className="text-sm text-white/70 leading-relaxed">
            FarmPilot synthesizes daily operations, input logs, and financial ledgers into an explainable Farm Health Score and real-time P&L intelligence.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] text-white/60 uppercase font-semibold">Live Metric</span>
              <p className="text-base font-bold text-white mt-0.5">82 / 100 Health</p>
              <p className="text-[10px] text-emerald-400">Optimal execution index</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-[10px] text-white/60 uppercase font-semibold">P&L Simulation</span>
              <p className="text-base font-bold text-white mt-0.5">+₹77,500 ROI</p>
              <p className="text-[10px] text-emerald-400">62.5% projected margin</p>
            </div>
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
              <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Welcome back</h1>
              <p className="text-xs text-[#64748B] mt-1">
                Sign in to your farm operations command center
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
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@greenvalley.in"
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
                    placeholder="Enter account password"
                    required
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
                    Sign In to FarmPilot
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E8EB]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-[#94A3B8] font-medium text-[11px]">Instant Demo Evaluation</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={demoLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#143D30] text-xs font-semibold transition-colors cursor-pointer"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sprout className="w-4 h-4 text-[#143D30]" />
                  <span>Explore Green Valley Demo Farm</span>
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-[#64748B]">
              Need a new organization?{' '}
              <Link to="/register" className="text-[#143D30] font-semibold hover:underline">
                Register Farm Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
