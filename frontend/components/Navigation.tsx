'use client';
import { Home, Calendar, Dumbbell, Settings, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const navItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Routines', href: '/routines', icon: Calendar },
  { name: 'Workout', href: '/workout', icon: Dumbbell },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full md:hidden z-50">
        <div className="relative mx-2 mb-2 rounded-3xl overflow-hidden backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl shadow-black/20">
          {/* Gradient overlay for liquid glass effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/5 via-transparent to-white/10 pointer-events-none" />
          
          <div className="relative flex justify-around items-center h-20 px-1 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex flex-col items-center justify-center min-w-[64px] min-h-[64px] w-full h-full transition-all duration-300 rounded-2xl',
                    isActive 
                      ? 'text-white scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10 active:scale-95'
                  )}
                >
                  <div className={clsx(
                    'relative transition-all duration-300',
                    isActive && 'drop-shadow-[0_0_10px_rgba(59,130,246,0.9)]'
                  )}>
                    <item.icon className="w-7 h-7 mb-1" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && (
                      <div className="absolute inset-0 bg-neon-blue/40 blur-xl rounded-full -z-10" />
                    )}
                  </div>
                  <span className={clsx(
                    'text-[11px] font-semibold transition-all duration-300 leading-tight',
                    isActive && 'text-neon-blue'
                  )}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed top-0 left-0 w-64 h-full glass-panel border-r border-glass-border z-50">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            FitSync
          </h1>
        </div>
        <div className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center p-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-white/10 neon-text-blue border border-white/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
