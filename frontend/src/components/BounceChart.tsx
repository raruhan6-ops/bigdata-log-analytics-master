'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface BounceChartProps {
  data: { url: string; bounce_rate: number; entry_count: number }[];
}

export default function BounceChart({ data }: BounceChartProps) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const sorted = [...data].sort((a, b) => a.bounce_rate - b.bounce_rate);
    const urls = sorted.map((d) => d.url.length > 25 ? d.url.slice(0, 25) + '...' : d.url);
    const rates = sorted.map((d) => d.bounce_rate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params[0].dataIndex;
          const item = sorted[idx];
          return `${item.url}<br/>跳出率: <b>${item.bounce_rate}%</b><br/>入口量: ${item.entry_count}`;
        },
      },
      grid: {
        left: '20%',
        right: '8%',
        bottom: '3%',
        top: '3%',
        containLabel: false,
      },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%' },
      },
      yAxis: {
        type: 'category',
        data: urls,
        axisLabel: {
          fontSize: 11,
          color: '#475569',
        },
      },
      series: [
        {
          name: '跳出率',
          type: 'bar',
          data: rates,
          barWidth: '60%',
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params: any) => {
              const rate = params.value;
              if (rate >= 70) return '#ef4444';
              if (rate >= 50) return '#f59e0b';
              return '#10b981';
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            fontSize: 11,
            color: '#64748b',
          },
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">暂无跳出率数据</div>;
  }

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}
