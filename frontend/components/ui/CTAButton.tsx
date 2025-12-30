import Link from 'next/link';
import { ReactNode } from 'react';

interface CTAButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
}

export function CTAButton({ 
  children, 
  onClick, 
  href, 
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button'
}: CTAButtonProps) {
  const baseClasses = "font-bold rounded-2xl hover:scale-105 active:scale-95 transition-transform inline-flex items-center justify-center";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-[#00F0FF] to-[#00FF9F] text-black",
    secondary: "backdrop-blur-xl bg-white/10 border border-white/20 text-white"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-4",
    lg: "px-10 py-5 text-lg"
  };

  const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return <Link href={href} className={combinedClassName}>{children}</Link>;
  }

  return <button onClick={onClick} type={type} className={combinedClassName}>{children}</button>;
}
