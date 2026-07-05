'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface SessionChartProps {
  data: { label: string; count: number }[];
}

export default function SessionChart({ data }: SessionChartProps) {
  const option = useMemo(() => {
    const labels = data.map((d) => d.label);
    const counts = data.map((d) => d.count);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: labels,
        axisLabel: { fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        name: '会话数',
      },
      series: [
        {
          name: '会话数',
          type: 'bar',
          barWidth: '50%',
          data: counts,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#6366f1' },
                { offset: 1, color: '#818cf8' },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">暂无会话数据</div>;
  }

  return <ReactECharts option={option} style={{ height: '250px', width: '100%' }} />;
}
