import React from 'react';
import { ResponsivePie } from '@nivo/pie';
import { motion } from 'framer-motion';

interface PortfolioPieChartProps {
  data: Array<{
    id: string;
    label: string;
    value: number;
    color: string;
  }>;
  height?: number;
  showLegend?: boolean;
  interactive?: boolean;
}

export const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({
  data,
  height = 300,
  showLegend = true,
  interactive = true,
}) => {
  const theme = {
    background: 'transparent',
    text: {
      fontSize: 12,
      fill: '#64748b',
      fontFamily: 'Inter, system-ui, sans-serif',
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
    legends: {
      text: {
        fontSize: 12,
        fill: '#475569',
        fontWeight: 500,
      },
    },
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ height }}
    >
      <ResponsivePie
        data={data}
        theme={theme}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        innerRadius={0.6}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={{ datum: 'data.color' }}
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        enableArcLinkLabels={false}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#1e293b"
        arcLabelsRadiusOffset={0.55}
        arcLabelsComponent={({ datum, label, style }) => (
          <text
            {...style}
            dy={4}
            textAnchor="middle"
            fontSize={11}
            fontWeight={600}
            fill="#1e293b"
          >
            {datum.value > 5 ? `${datum.value.toFixed(0)}%` : ''}
          </text>
        )}
        tooltip={({ datum }) => (
          <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
            <div className="flex items-center space-x-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: datum.color }}
              />
              <span className="font-semibold text-slate-900">{datum.label}</span>
            </div>
            <div className="text-sm text-slate-600">
              <div>Value: {formatValue(datum.data.rawValue || datum.value)}</div>
              <div>Percentage: {datum.value.toFixed(1)}%</div>
            </div>
          </div>
        )}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#475569',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 12,
                  symbolShape: 'circle',
                },
              ]
            : []
        }
        animate={interactive}
        motionConfig="gentle"
      />
    </motion.div>
  );
};