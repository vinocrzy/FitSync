'use client';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { user, logout } = useStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
        <div className="ios-glass-card w-24 h-24 rounded-3xl flex items-center justify-center mb-6">
           <UserIcon className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Guest User</h2>
        <p className="text-gray-400 mb-10 max-w-xs leading-relaxed">Log in to sync your workouts across devices and save your progress.</p>
        <Link 
          href="/login"
          className="backdrop-blur-xl bg-neon-blue/30 border border-neon-blue/50 text-white font-bold px-10 py-4 rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(0,240,255,0.3)]"
        >
          Login / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="ios-glass-card p-7 rounded-3xl mb-6 flex items-center gap-5">
        <div className="w-20 h-20 bg-gradient-to-br from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-neon-blue/30">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user.name}</h2>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 backdrop-blur-xl bg-red-500/15 text-red-400 border border-red-500/30 py-4 rounded-2xl hover:bg-red-500/25 hover:scale-[1.02] transition-all font-bold"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>

      <div className="mt-12">
        <h3 className="text-sm uppercase text-gray-400 font-bold mb-4">Sync Status</h3>
        <div className="ios-glass-card p-5 rounded-2xl flex items-center justify-center gap-2 text-neon-green">
           <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_8px_rgba(0,255,159,0.8)]"></span>
           <span className="text-sm font-mono font-bold">Sync Active</span>
        </div>
      </div>
    </div>
  );
}
