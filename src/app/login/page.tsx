'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/atoms/button';
import { FormField } from '@/components/molecules';
import { login } from '@/services/auth-service';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const response = await login(email, password);

    if (response.success) {
      router.replace('/');
    } else {
      setError(response.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary text-primary-foreground text-3xl font-bold mb-4 shadow-lg shadow-primary/25">
            G
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">The Green Candle</h1>
          <p className="text-muted-foreground mt-2">The Green Candle Admin Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-3xl shadow-2xl border border-border p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-3xl bg-destructive/15 text-destructive text-sm border border-destructive/20 animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormField
              label="Email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <FormField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-sm mt-6">
          © 2025 The Green Candle. All rights reserved.
        </p>
      </div>
    </div>
  );
}
