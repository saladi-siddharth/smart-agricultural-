import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sprout, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signInDemo } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sprout className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">FarmPilot</span>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Intelligent Farm<br />
            Operations<br />
            Command Center
          </h2>
          <p className="text-lg text-white/70 max-w-md mb-8">
            Transform fragmented farm operations into actionable intelligence.
            See what's happening, understand what it means, act on what matters.
          </p>
          <div className="space-y-3">
            {[
              'Farm Health Score & Crop Progress',
              'Intelligent Alerts & Recommendations',
              'Profitability Engine & Cost Analysis',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-amber-500)]" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[var(--color-surface-secondary)]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold">FarmPilot</span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-[var(--color-border-light)]">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Welcome back</h1>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Sign in to your farm command center
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 animate-scale-in">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="farmer@example.com"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                    text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent
                    placeholder:text-[var(--color-text-muted)] transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-[var(--color-border-light)] bg-[var(--color-surface-secondary)]
                      text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-transparent
                      placeholder:text-[var(--color-text-muted)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                  gradient-primary text-white text-sm font-medium shadow-sm
                  hover:shadow-md transition-all duration-200
                  disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border-light)]" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-[var(--color-text-muted)] font-medium">Or Quick Explore</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await signInDemo();
                navigate('/dashboard');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                border border-[var(--color-primary-200)] bg-[var(--color-primary-50)]
                text-[var(--color-primary-700)] text-sm font-semibold hover:bg-[var(--color-primary-100)]
                transition-all duration-200 shadow-xs cursor-pointer"
            >
              <Sprout className="w-4 h-4 text-[var(--color-primary-600)]" />
              <span>Explore Green Valley Demo Farm</span>
            </button>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-[var(--color-primary-600)] font-medium hover:text-[var(--color-primary-700)]">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
