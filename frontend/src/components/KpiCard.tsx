import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit: string;
  change: number;
  icon: React.ElementType;
  color: string;
}

export default function KpiCard({ label, value, unit, change, icon: Icon, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-100 p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <div className="flex items-baseline">
          <h3 className="text-2xl font-bold text-gray-900">
            {value} <span className="text-sm font-normal text-gray-500">{unit}</span>
          </h3>
        </div>
      </div>
      <div 
        className="p-3 rounded-xl flex items-center justify-center" 
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={24} />
      </div>
    </div>
  );
}
