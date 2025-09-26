"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, LineChart, PieChart, TrendingUp } from "lucide-react";

interface ChartComponentProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area';
  xField: string;
  yField: string;
  title: string;
  height?: number;
  color?: string;
}

export function ChartComponent({
  data,
  type,
  xField,
  yField,
  title,
  height = 200,
  color = "#3b82f6"
}: ChartComponentProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No data available</p>
        </div>
      </div>
    );
  }

  // Safely extract numeric values and filter out invalid ones
  const numericValues = data
    .map(item => {
      const value = item[yField];
      return typeof value === 'number' && !isNaN(value) ? value : 0;
    })
    .filter(value => !isNaN(value));

  // Ensure we have valid data
  if (numericValues.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No valid data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...numericValues);
  const minValue = Math.min(...numericValues);
  
  // Ensure we don't have identical min/max values which could cause division by zero
  const valueRange = maxValue - minValue;
  const safeValueRange = valueRange === 0 ? 1 : valueRange;

  const renderLineChart = () => {
    const points = data.map((item, index) => {
      // Safe calculation of x coordinate
      const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
      
      // Safe calculation of y coordinate
      const itemValue = typeof item[yField] === 'number' && !isNaN(item[yField]) ? item[yField] : 0;
      const y = ((maxValue - itemValue) / safeValueRange) * 80 + 10;
      
      // Ensure coordinates are valid numbers
      const safeX = isNaN(x) ? 50 : x;
      const safeY = isNaN(y) ? 50 : y;
      
      return `${safeX},${safeY}`;
    }).join(' ');

    return (
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.2"
            />
          ))}
          
          {/* Area fill */}
          <path
            d={`M 0,100 L ${points} L 100,100 Z`}
            fill="url(#lineGradient)"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="0.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            // Safe calculation of coordinates
            const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
            const itemValue = typeof item[yField] === 'number' && !isNaN(item[yField]) ? item[yField] : 0;
            const y = ((maxValue - itemValue) / safeValueRange) * 80 + 10;
            
            // Ensure coordinates are valid numbers
            const safeX = isNaN(x) ? 50 : x;
            const safeY = isNaN(y) ? 50 : y;
            
            return (
              <circle
                key={index}
                cx={safeX}
                cy={safeY}
                r="1"
                fill={color}
                className="hover:r-2 transition-all cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs">
            {data[hoveredIndex][xField]}: {data[hoveredIndex][yField]}
          </div>
        )}
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          {data.map((item, index) => (
            <span key={index} className={`${index % 2 === 0 ? '' : 'hidden md:block'}`}>
              {item[xField]}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderBarChart = () => {
    const barWidth = data.length > 0 ? 80 / data.length : 80;
    
    return (
      <div className="relative w-full" style={{ height: `${height}px` }}>
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="10"
              y1={y}
              x2="90"
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="0.2"
            />
          ))}
          
          {/* Bars */}
          {data.map((item, index) => {
            const itemValue = typeof item[yField] === 'number' && !isNaN(item[yField]) ? item[yField] : 0;
            const x = 10 + (index * barWidth) + (barWidth * 0.1);
            const barHeight = ((itemValue - minValue) / safeValueRange) * 80;
            const y = 90 - barHeight;
            
            // Ensure all values are valid
            const safeX = isNaN(x) ? 10 : x;
            const safeY = isNaN(y) ? 90 : y;
            const safeBarHeight = isNaN(barHeight) || barHeight < 0 ? 0 : barHeight;
            const safeBarWidth = isNaN(barWidth * 0.8) ? 1 : barWidth * 0.8;
            
            return (
              <rect
                key={index}
                x={safeX}
                y={safeY}
                width={safeBarWidth}
                height={safeBarHeight}
                fill="url(#barGradient)"
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div className="absolute top-2 right-2 bg-black text-white px-2 py-1 rounded text-xs">
            {data[hoveredIndex][xField]}: {data[hoveredIndex][yField]}
          </div>
        )}
        
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-2">
          {data.map((item, index) => (
            <span key={index} className={`${index % 2 === 0 ? '' : 'hidden md:block'} truncate`}>
              {item[xField]}
            </span>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item[yField], 0);
    let currentAngle = 0;
    
    const slices = data.map((item, index) => {
      const percentage = (item[yField] / total) * 100;
      const angle = (item[yField] / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;
      
      const x1 = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
      const y1 = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
      const x2 = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
      const y2 = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M 50 50`,
        `L ${x1} ${y1}`,
        `A 35 35 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
      ];
      
      return {
        path: pathData,
        color: colors[index % colors.length],
        percentage: percentage.toFixed(1),
        label: item[xField],
        value: item[yField]
      };
    });
    
    return (
      <div className="flex items-center justify-center">
        <div className="relative" style={{ width: `${height}px`, height: `${height}px` }}>
          <svg className="w-full h-full" viewBox="0 0 100 100">
            {slices.map((slice, index) => (
              <path
                key={index}
                d={slice.path}
                fill={slice.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            ))}
          </svg>
          
          {/* Tooltip */}
          {hoveredIndex !== null && (
            <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 rounded text-xs">
              {slices[hoveredIndex].label}: {slices[hoveredIndex].percentage}%
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="ml-4 space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate max-w-24">{slice.label}</span>
              <span className="text-muted-foreground">({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getIcon = () => {
    switch (type) {
      case 'line':
      case 'area':
        return <LineChart className="h-4 w-4" />;
      case 'bar':
        return <BarChart3 className="h-4 w-4" />;
      case 'pie':
        return <PieChart className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
      case 'area':
        return renderLineChart();
      case 'bar':
        return renderBarChart();
      case 'pie':
        return renderPieChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        {getIcon()}
        <h3 className="text-sm font-medium">{title}</h3>
      </div>
      {renderChart()}
    </div>
  );
}