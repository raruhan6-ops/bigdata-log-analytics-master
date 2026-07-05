'use client';

import React, { useEffect, useState } from 'react';
import KpiCard from '@/components/KpiCard';
import TrendChart from '@/components/TrendChart';
import PieChart from '@/components/PieChart';
import SessionChart from '@/components/SessionChart';
import { getOverview, getTrend } from '@/api/dashboard';
import { getTerminalDist, getRetentionData, getSessionDistribution } from '@/api/analysis';
import { Eye, Users, Monitor, Clock, XCircle } from 'lucide-react';

export default function Dashboard() {
  const [kpiCards, setKpiCards] = useState([
    { label: '页面浏览 (PV)', value: 0, unit: '', change: 0, icon: Eye, color: '#409EFF' },
    { label: '独立访客 (UV)', value: 0, unit: '', change: 0, icon: Users, color: '#67C23A' },
    { label: '独立 IP', value: 0, unit: '', change: 0, icon: Monitor, color: '#E6A23C' },
    { label: '会话时长 (平均)', value: 0, unit: '秒', change: 0, icon: Clock, color: '#F56C6C' },
    { label: '首页跳出率', value: 0, unit: '%', change: 0, icon: XCircle, color: '#909399' },
  ]);

  const [trendDays, setTrendDays] = useState(7);
  const [pvSeries, setPvSeries] = useState([]);
  const [uvSeries, setUvSeries] = useState([]);
  const [terminalData, setTerminalData] = useState([]);
  const [retentionList, setRetentionList] = useState([]);
  const [sessionBuckets, setSessionBuckets] = useState([]);

  useEffect(() => {
    loadOverview();
    loadTrend(7);
    loadTerminal();
    loadRetention();
    loadSessionDist();
  }, []);

  async function loadOverview() {
    try {
      const res: any = await getOverview();
      setKpiCards(prev => [
        { ...prev[0], value: res.pv?.toLocaleString() || res.pv },
        { ...prev[1], value: res.uv?.toLocaleString() || res.uv },
        { ...prev[2], value: res.ip_count?.toLocaleString() || res.ip_count },
        { ...prev[3], value: res.avg_session_duration || 0 },
        { ...prev[4], value: res.bounce_rate || 0 },
      ]);
    } catch (e) {
      console.error('加载 KPI 失败:', e);
    }
  }

  async function loadTrend(days: number) {
    setTrendDays(days);
    try {
      const res: any = await getTrend(days);
      setPvSeries(res.pv_series || []);
      setUvSeries(res.uv_series || []);
    } catch (e) {
      console.error('加载趋势失败:', e);
    }
  }

  async function loadTerminal() {
    try {
      const res: any = await getTerminalDist();
      setTerminalData(res.items || []);
    } catch (e) {
      console.error('加载终端分布失败:', e);
    }
  }

  async function loadRetention() {
    try {
      const res: any = await getRetentionData(14);
      setRetentionList(res || []);
    } catch (e) {
      console.error('加载留存数据失败:', e);
    }
  }

  async function loadSessionDist() {
    try {
      const res: any = await getSessionDistribution(7);
      setSessionBuckets(res?.buckets || []);
    } catch (e) {
      console.error('加载会话分布失败:', e);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">运营大盘 Dashboard</h2>
          <p className="text-slate-500 mt-2 text-sm">监控网站核心流量指标与用户生命周期留存状况</p>
        </div>
        <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 backdrop-blur-xl bg-white/70 p-1">
          <button onClick={() => loadTrend(7)} className={`px-5 py-1.5 text-sm font-medium rounded-md transition-all ${trendDays===7 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>最近 7 天</button>
          <button onClick={() => loadTrend(30)} className={`px-5 py-1.5 text-sm font-medium rounded-md transition-all ${trendDays===30 ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-50'}`}>最近 30 天</button>
        </div>
      </div>

      {/* KPI 卡片行 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {kpiCards.map(card => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>

      {/* 趋势图与分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-7 border border-slate-200/60">
          <h3 className="font-bold text-lg text-slate-800 mb-6">PV/UV 流量趋势</h3>
          <TrendChart pvSeries={pvSeries} uvSeries={uvSeries} />
        </div>

        <div className="col-span-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-7 border border-slate-200/60">
          <h3 className="font-bold text-lg text-slate-800 mb-6">终端设备分布</h3>
          <PieChart data={terminalData} name="terminal" />
        </div>
      </div>

      {/* 留存率趋势 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-7 border border-slate-200/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800">新用户生命周期留存状态 (近 14 天)</h3>
          <span className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Cohort Analysis</span>
        </div>
        
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left bg-white">
            <thead>
              <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200">
                <th className="p-4 font-semibold text-sm">观察日期</th>
                <th className="p-4 font-semibold text-sm text-right">活跃基数</th>
                <th className="p-4 font-semibold text-sm text-right">次日留存 (Day 1)</th>
                <th className="p-4 font-semibold text-sm text-right">3日留存 (Day 3)</th>
                <th className="p-4 font-semibold text-sm text-right">7日留存 (Day 7)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {retentionList.map((row: any, i) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-700">{row.date}</td>
                  <td className="p-4 text-sm text-right font-mono text-slate-600">{row.new_users?.toLocaleString()}</td>
                  <td className="p-4 text-sm text-right">
                    <span className="inline-flex max-w-[80px] w-full justify-between items-center text-blue-700 font-semibold bg-blue-50 px-2 py-1 rounded">
                      <span className="opacity-0">-</span>{row.retention_1d}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className="inline-flex max-w-[80px] w-full justify-between items-center text-indigo-700 font-semibold bg-indigo-50 px-2 py-1 rounded">
                      <span className="opacity-0">-</span>{row.retention_3d}%
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className="inline-flex max-w-[80px] w-full justify-between items-center text-violet-700 font-semibold bg-violet-50 px-2 py-1 rounded">
                      <span className="opacity-0">-</span>{row.retention_7d}%
                    </span>
                  </td>
                </tr>
              ))}
              {retentionList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">目前选定区间内暂无数据累积</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 会话时长分布 (Feature 7) */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-7 border border-slate-200/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg text-slate-800">会话时长分布</h3>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">Session Analysis</span>
        </div>
        <SessionChart data={sessionBuckets} />
      </div>
    </div>
  );
}
