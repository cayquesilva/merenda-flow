import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DivideIcon as LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: typeof LucideIcon;
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
        return 'border-warning/30 bg-warning/5 hover:border-warning/50';
      case 'success':
        return 'border-success/30 bg-success/5 hover:border-success/50';
      case 'destructive':
        return 'border-destructive/30 bg-destructive/5 hover:border-destructive/50';
      default:
        return 'border-border/80 bg-card hover:border-primary/40';
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
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border",
      getCardStyles()
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2.5 rounded-xl transition-colors duration-200 border",
          variant === 'warning' && "bg-warning/10 border-warning/20",
          variant === 'success' && "bg-success/10 border-success/20", 
          variant === 'destructive' && "bg-destructive/10 border-destructive/20",
          variant === 'default' && "bg-primary/10 border-primary/20"
        )}>
          <Icon className={`h-5 w-5 ${getIconStyles()}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {description}
          </p>
        )}
        {trend && (
          <p className="text-xs text-muted-foreground mt-1.5 font-medium">
            <span className={trend.value > 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </span>{' '}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}