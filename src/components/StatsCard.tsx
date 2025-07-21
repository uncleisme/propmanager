import React from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: string;
  percent?: {
    value: number;
    up: boolean;
  };
  onClick?: () => void;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  color,
  trend,
  percent,
  onClick,
  className = ''
}) => {
  const isClickable = !!onClick;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-6 
        transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        ${isClickable ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 truncate mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-gray-900 truncate">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`${color} p-3 rounded-xl ml-4 transform transition-transform duration-300 hover:scale-110`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center min-h-[24px]">
        {percent ? (
          <div className={`inline-flex items-center text-sm font-medium ${
            percent.up ? 'text-green-600' : 'text-red-600'
          }`}>
            {percent.up ? (
              <ArrowUpRight className="w-4 h-4 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 mr-1" />
            )}
            <span>{percent.value}%</span>
            <span className="text-gray-500 ml-1">
              {percent.up ? 'increase' : 'decrease'}
            </span>
          </div>
        ) : trend ? (
          <div className="inline-flex items-center text-sm text-green-600 font-medium">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>{trend}</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default StatsCard;