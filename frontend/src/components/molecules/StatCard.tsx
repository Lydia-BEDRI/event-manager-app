import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  trend?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, trend }) => {
  return (
    <div className="bg-primary-dark rounded-2xl p-6 border border-primary-gray/20">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-accent/10 rounded-2xl">
          <Icon className="text-primary-accent" size={24} />
        </div>
        {trend && (
          <span className="text-green-400 text-sm font-medium">{trend}</span>
        )}
      </div>
      <h3 className="text-primary-gray text-sm font-medium mb-1">{title}</h3>
      <p className="text-primary-white text-2xl font-bold">{value}</p>
    </div>
  );
};

export default StatCard;
