import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  rounded?: 'xl' | '2xl' | '3xl';
  interactive?: boolean;
  className?: string;
}

export function GlassCard({ 
  children, 
  padding = 'md', 
  rounded = '2xl', 
  interactive = false,
  className = ''
}: GlassCardProps) {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  const roundedClasses = {
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl'
  };

  return (
    <div className={`
      backdrop-blur-xl bg-white/10 border border-white/20
      ${roundedClasses[rounded]} ${paddingClasses[padding]}
      ${interactive ? 'hover:bg-white/15 hover:scale-[1.02] cursor-pointer transition-all' : ''}
      ${className}
    `.trim().replace(/\s+/g, ' ')}>
      {children}
    </div>
  );
}
