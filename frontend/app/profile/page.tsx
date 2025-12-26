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
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
           <UserIcon className="w-10 h-10 text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Guest User</h2>
        <p className="text-gray-400 mb-8 max-w-xs">Log in to sync your workouts across devices and save your progress.</p>
        <Link 
          href="/login"
          className="bg-neon-blue text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition-transform"
        >
          Login / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="glass-panel p-6 rounded-2xl mb-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
          {user.name[0].toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-xl hover:bg-red-500/20 transition-colors font-semibold"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>

      <div className="mt-12">
        <h3 className="text-sm uppercase text-gray-500 font-bold mb-4">Sync Status</h3>
        <div className="glass-panel p-4 rounded-xl flex items-center justify-center gap-2 text-neon-green">
           <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
           <span className="text-sm font-mono">Sync Active</span>
        </div>
      </div>
    </div>
  );
}
