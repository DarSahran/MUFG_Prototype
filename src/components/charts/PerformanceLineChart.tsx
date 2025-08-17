import React from 'react';
import { ResponsiveLine } from '@nivo/line';
import { motion } from 'framer-motion';

interface PerformanceLineChartProps {
  data: Array<{
    id: string;
    color: string;
    data: Array<{
      x: string | number;
      y: number;
    }>;
  }>;
  height?: number;
  showArea?: boolean;
  enablePoints?: boolean;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export const PerformanceLineChart: React.FC<PerformanceLineChartProps> = ({
  data,
  height = 300,
  showArea = true,
  enablePoints = false,
  yAxisLabel = 'Value ($)',
  xAxisLabel = 'Time',
}) => {
  const theme = {
    background: 'transparent',
    text: {
      fontSize: 11,
      fill: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    axis: {
      domain: {
        line: {
          stroke: '#e2e8f0',
          strokeWidth: 1,
        },
      },
      legend: {
        text: {
          fontSize: 12,
          fill: '#475569',
          fontWeight: 500,
        },
      },
      ticks: {
        line: {
          stroke: '#e2e8f0',
          strokeWidth: 1,
        },
        text: {
          fontSize: 11,
          fill: '#64748b',
        },
      },
    },
    grid: {
      line: {
        stroke: '#f1f5f9',
        strokeWidth: 1,
        strokeDasharray: '4 4',
      },
    },
    tooltip: {
      container: {
        background: 'white',
        color: '#1e293b',
        fontSize: '12px',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e2e8f0',
        padding: '12px',
      },
    },
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height }}
    >
      <ResponsiveLine
        data={data}
        theme={theme}
        margin={{ top: 20, right: 30, bottom: 60, left: 80 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false,
        }}
        yFormat={formatValue}
        curve="cardinal"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: xAxisLabel,
          legendOffset: 50,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: yAxisLabel,
          legendOffset: -60,
          legendPosition: 'middle',
          format: (value) => formatValue(value),
        }}
        enableGridX={false}
        enableGridY={true}
        colors={{ datum: 'color' }}
        lineWidth={3}
        enablePoints={enablePoints}
        pointSize={6}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={showArea}
        areaOpacity={0.1}
        useMesh={true}
        animate={true}
        motionConfig="gentle"
        tooltip={({ point }) => (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
            <div className="flex items-center space-x-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: point.serieColor }}
              />
              <span className="font-semibold text-slate-900">{point.serieId}</span>
            </div>
            <div className="text-sm text-slate-600">
              <div>Date: {point.data.xFormatted}</div>
              <div>Value: {formatValue(point.data.y as number)}</div>
            </div>
          </div>
        )}
      />
    </motion.div>
  );
};