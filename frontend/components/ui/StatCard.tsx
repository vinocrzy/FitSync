import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  value: string | number;
  caption?: string;
}

export function StatCard({ icon: Icon, iconColor, label, value, caption }: StatCardProps) {
  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-sm text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-3xl font-bold font-mono text-white mb-1">{value}</div>
      {caption && <div className="text-xs text-gray-400">{caption}</div>}
    </div>
  );
}
