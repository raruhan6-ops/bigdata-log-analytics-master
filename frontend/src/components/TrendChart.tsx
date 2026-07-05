import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface TrendChartProps {
  pvSeries: any[];
  uvSeries: any[];
}

export default function TrendChart({ pvSeries, uvSeries }: TrendChartProps) {
  const option = useMemo(() => {
    const xData = pvSeries.map((item) => item.label);
    const pvData = pvSeries.map((item) => item.pv);
    const uvData = uvSeries.map((item) => item.uv);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['PV (浏览量)', 'UV (访客数)'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xData
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'PV (浏览量)',
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: { color: '#409EFF' },
          data: pvData
        },
        {
          name: 'UV (访客数)',
          type: 'line',
          smooth: true,
          areaStyle: {
            opacity: 0.1
          },
          itemStyle: { color: '#67C23A' },
          data: uvData
        }
      ]
    };
  }, [pvSeries, uvSeries]);

  return <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />;
}