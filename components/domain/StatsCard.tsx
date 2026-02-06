import { Card } from '@/components/ui/Card';

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'cyan';
  subtitle?: string;
}

export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  subtitle,
}: StatsCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-600/10',
    green: 'bg-green-600/10',
    yellow: 'bg-yellow-600/10',
    red: 'bg-red-600/10',
    purple: 'bg-purple-600/10',
    cyan: 'bg-cyan-600/10',
  };
  
  const iconBg = {
    blue: 'bg-blue-600/20',
    green: 'bg-green-600/20',
    yellow: 'bg-yellow-600/20',
    red: 'bg-red-600/20',
    purple: 'bg-purple-600/20',
    cyan: 'bg-cyan-600/20',
  };
  
  return (
    <Card hover className="relative overflow-hidden">
      {/* Accent background */}
      <div className={`absolute top-0 right-0 w-24 h-24 ${colorClasses[color]} rounded-bl-full`} />
      
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          
          {icon && (
            <div className={`${iconBg[color]} p-3 rounded-xl`}>
              <span className="text-2xl">{icon}</span>
            </div>
          )}
        </div>
        
        {trend && (
          <div className="flex items-center gap-1">
            <span className={trend.isPositive ? 'text-green-400' : 'text-red-400'}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-400">vs anterior</span>
          </div>
        )}
      </div>
    </Card>
  );
};
