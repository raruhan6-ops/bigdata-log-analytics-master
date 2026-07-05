import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface PieChartProps {
  data: any[];
  name: string;
}

export default function PieChart({ data, name }: PieChartProps) {
  const option = useMemo(() => {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0
      },
      series: [
        {
          name: name,
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: data
        }
      ]
    };
  }, [data, name]);

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}