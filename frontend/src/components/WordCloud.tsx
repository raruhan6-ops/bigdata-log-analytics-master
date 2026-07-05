'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface WordCloudProps {
  data: { keyword: string; search_count: number; rank: number }[];
}

export default function WordCloudChart({ data }: WordCloudProps) {
  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const maxCount = Math.max(...data.map((d) => d.search_count));
    const colors = ['#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => `${params.name}: ${params.value} 次搜索`,
      },
      series: [
        {
          type: 'pie',
          radius: ['20%', '75%'],
          roseType: 'area',
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            fontSize: 12,
            formatter: '{b}',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold',
            },
          },
          data: data.map((d, i) => ({
            name: d.keyword,
            value: d.search_count,
            itemStyle: { color: colors[i % colors.length] },
          })),
        },
      ],
    };
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">暂无搜索数据</div>;
  }

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}
