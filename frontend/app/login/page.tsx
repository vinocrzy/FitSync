'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setAuth(data.user, data.token);
        toast.success(`Welcome back, ${data.user.name}`);
        router.push('/');
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="ios-glass-card p-10 rounded-3xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Login to FitSync</h1>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full ios-glass-input rounded-2xl p-4 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-2 font-bold">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full ios-glass-input rounded-2xl p-4 text-sm"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white font-bold py-4 rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(0,240,255,0.3)]"
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Don't have an account? <Link href="/register" className="text-neon-blue hover:underline font-bold">Register</Link>
        </p>
      </div>
    </div>
  );
}
