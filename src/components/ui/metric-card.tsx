import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'warning' | 'success' | 'destructive';
}

export function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: MetricCardProps) {
  const getCardStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border';
    }
  };

  const getIconStyles = () => {
    switch (variant) {
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-success';
      case 'destructive':
        return 'text-destructive';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={getCardStyles()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconStyles()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value > 0 ? 'text-success' : 'text-destructive'}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>{' '}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}