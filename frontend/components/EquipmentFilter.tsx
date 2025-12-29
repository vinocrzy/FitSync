'use client';
import { useStore } from '@/lib/store';
import clsx from 'clsx';
import { Filter } from 'lucide-react';
import { EQUIPMENT_OPTIONS } from '@/lib/constants';

export default function EquipmentFilter() {
  // Optimized: Use selective Zustand subscriptions to prevent unnecessary re-renders
  const availableEquipment = useStore(state => state.availableEquipment);
  const toggleEquipment = useStore(state => state.toggleEquipment);

  return (
    <div className="p-4 glass-panel rounded-xl mb-6">
      <div className="flex items-center gap-2 mb-3 text-neon-blue">
        <Filter className="w-4 h-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wider">Equipment Filter</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_OPTIONS.map((item) => {
          const isActive = availableEquipment.includes(item);
          return (
            <button
              key={item}
              onClick={() => toggleEquipment(item)}
              className={clsx(
                'px-3 py-1.5 text-xs rounded-full border transition-all duration-200',
                isActive
                  ? 'bg-neon-blue/20 border-neon-blue text-white shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
              )}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}
