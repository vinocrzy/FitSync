import { LucideIcon } from 'lucide-react';
import { CTAButton } from './CTAButton';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

export function EmptyState({ icon: Icon, title, description, ctaText, ctaHref, ctaOnClick }: EmptyStateProps) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-12 text-center">
      <Icon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
      {ctaText && (ctaHref || ctaOnClick) && (
        <CTAButton href={ctaHref} onClick={ctaOnClick} variant="primary">
          {ctaText}
        </CTAButton>
      )}
    </div>
  );
}
