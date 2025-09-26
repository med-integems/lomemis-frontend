"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Base chart interfaces
interface ChartProps {
  className?: string;
  title?: string;
  description?: string;
}

interface DataPoint {
  name: string;
  value: number;
  color?: string;
}

interface LineChartData {
  name: string;
  [key: string]: string | number;
}

// Simple Line Chart Component
export function SimpleLineChart({ 
  data, 
  xKey = 'name', 
  yKeys, 
  colors = ['#007A33', '#005DAA', '#A3C940'], 
  className,
  title,
  description 
}: ChartProps & {
  data: LineChartData[];
  xKey?: string;
  yKeys: string[];
  colors?: string[];
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.flatMap(item => 
    yKeys.map(key => Number(item[key]) || 0)
  ));
  const chartHeight = 200;
  const chartWidth = 400;
  const padding = 40;

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg width={chartWidth + padding * 2} height={chartHeight + padding * 2} className="min-w-full">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <g key={ratio}>
                <text
                  x={padding - 10}
                  y={padding + chartHeight - (ratio * chartHeight) + 4}
                  textAnchor="end"
                  className="text-xs fill-muted-foreground"
                >
                  {Math.round(maxValue * ratio)}
                </text>
                <line
                  x1={padding}
                  y1={padding + chartHeight - (ratio * chartHeight)}
                  x2={padding + chartWidth}
                  y2={padding + chartHeight - (ratio * chartHeight)}
                  stroke="#e2e8f0"
                  strokeWidth={1}
                />
              </g>
            ))}

            {/* X-axis labels */}
            {data.map((item, index) => (
              <text
                key={index}
                x={padding + (index * (chartWidth / (data.length - 1)))}
                y={padding + chartHeight + 20}
                textAnchor="middle"
                className="text-xs fill-muted-foreground"
              >
                {String(item[xKey]).substring(0, 8)}
              </text>
            ))}

            {/* Data lines */}
            {yKeys.map((yKey, keyIndex) => {
              const points = data.map((item, index) => {
                const x = padding + (data.length > 1 ? (index * (chartWidth / (data.length - 1))) : chartWidth / 2);
                const y = padding + chartHeight - ((Number(item[yKey]) || 0) / (maxValue || 1)) * chartHeight;
                
                // Ensure coordinates are valid
                const safeX = isNaN(x) ? padding : x;
                const safeY = isNaN(y) ? padding + chartHeight : y;
                
                return `${safeX},${safeY}`;
              }).join(' ');

              return (
                <polyline
                  key={yKey}
                  fill="none"
                  stroke={colors[keyIndex % colors.length]}
                  strokeWidth="2"
                  points={points}
                />
              );
            })}

            {/* Data points */}
            {yKeys.map((yKey, keyIndex) => 
              data.map((item, index) => {
                const x = padding + (data.length > 1 ? (index * (chartWidth / (data.length - 1))) : chartWidth / 2);
                const y = padding + chartHeight - ((Number(item[yKey]) || 0) / (maxValue || 1)) * chartHeight;
                
                // Ensure coordinates are valid
                const safeX = isNaN(x) ? padding : x;
                const safeY = isNaN(y) ? padding + chartHeight : y;
                
                return (
                  <circle
                    key={`${yKey}-${index}`}
                    cx={safeX}
                    cy={safeY}
                    r="4"
                    fill={colors[keyIndex % colors.length]}
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${item[xKey]}: ${item[yKey]}`}</title>
                  </circle>
                );
              })
            )}
          </svg>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {yKeys.map((yKey, index) => (
            <div key={yKey} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-muted-foreground capitalize">
                {yKey.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Bar Chart Component
export function SimpleBarChart({ 
  data, 
  className,
  title,
  description,
  colorScheme = 'default'
}: ChartProps & {
  data: DataPoint[];
  colorScheme?: 'default' | 'success' | 'warning' | 'danger';
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const colors = {
    default: ['#007A33', '#005DAA', '#A3C940', '#FF8042', '#8884D8', '#82CA9D'],
    success: ['#10B981', '#059669', '#047857', '#065F46'],
    warning: ['#F59E0B', '#D97706', '#B45309', '#92400E'],
    danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B']
  };

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || colors[colorScheme][index % colors[colorScheme].length]
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Simple Pie Chart Component (using CSS for simplicity)
export function SimplePieChart({ 
  data, 
  className,
  title,
  description 
}: ChartProps & {
  data: DataPoint[];
}) {
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const radius = 80;
  const centerX = 100;
  const centerY = 100;

  // Prevent division by zero
  const safeTotal = total === 0 ? 1 : total;
  let cumulativePercentage = 0;

  return (
    <Card className={className}>
      <CardHeader>
        {title && <CardTitle className="text-lg font-semibold">{title}</CardTitle>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="200" height="200" className="transform -rotate-90">
              {data.map((item, index) => {
                const itemValue = Number(item.value) || 0;
                const percentage = (itemValue / safeTotal) * 100;
                const safePercentage = isNaN(percentage) ? 0 : percentage;
                const strokeDasharray = `${safePercentage} ${100 - safePercentage}`;
                const strokeDashoffset = -cumulativePercentage;
                
                cumulativePercentage += safePercentage;
                
                return (
                  <circle
                    key={item.name}
                    cx={centerX}
                    cy={centerY}
                    r="30"
                    fill="transparent"
                    stroke={item.color || `hsl(${index * 360 / data.length}, 70%, 50%)`}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:stroke-width-25"
                    style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                  >
                    <title>{`${item.name}: ${itemValue} (${safePercentage.toFixed(1)}%)`}</title>
                  </circle>
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color || `hsl(${index * 360 / data.length}, 70%, 50%)` }}
              />
              <span className="text-sm text-muted-foreground">{item.name}</span>
              <span className="text-sm font-medium ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// KPI Card Component
export function KPICard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className,
  description,
  trend
}: {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
  description?: string;
  trend?: DataPoint[];
}) {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}</p>
              {change && (
                <p className={cn("text-xs", changeColors[changeType])}>
                  {change}
                </p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          {Icon && (
            <div className="flex-shrink-0">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Mini trend chart */}
        {trend && trend.length > 0 && (
          <div className="mt-4">
            <svg width="100%" height="30" className="overflow-visible">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className={changeColors[changeType]}
                points={trend.map((point, index) => 
                  `${(index / (trend.length - 1)) * 100},${30 - (point.value / Math.max(...trend.map(p => p.value))) * 20}`
                ).join(' ')}
              />
            </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Status Badge Component for alerts
export function StatusBadge({ 
  status, 
  children 
}: { 
  status: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}) {
  const statusColors = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800', 
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      statusColors[status]
    )}>
      {children}
    </span>
  );
}