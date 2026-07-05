'use client';

import React, { useEffect, useState } from 'react';
import { getTopPages, getBrowserDist, getTopKeywords, getBounceRates, getOsDist } from '@/api/analysis';
import PieChart from '@/components/PieChart';
import WordCloudChart from '@/components/WordCloud';
import BounceChart from '@/components/BounceChart';

export default function AnalysisPage() {
  const [pageDays, setPageDays] = useState(7);
  const [topPages, setTopPages] = useState([]);
  const [browserData, setBrowserData] = useState([]);
  const [osData, setOsData] = useState([]);

  const [searchDays, setSearchDays] = useState(7);
  const [topKeywords, setTopKeywords] = useState([]);
  
  const [bounceRates, setBounceRates] = useState([]);

  useEffect(() => {
    loadTopPages(7);
    loadDistributions();
    loadTopKeywords(7);
    loadBounceRates();
  }, []);

  async function loadTopPages(days: number) {
    setPageDays(days);
    try {
      const res: any = await getTopPages(20, days);
      setTopPages(res || []);
    } catch (e) {
      console.error('加载热门页面失败:', e);
    }
  }

  async function loadDistributions() {
    try {
      const [browser, os]: any[] = await Promise.all([
        getBrowserDist(7),
        getOsDist(7),
      ]);
      setBrowserData(browser?.items || []);
      setOsData(os?.items || []);
    } catch (e) {
      console.error('加载分布数据失败:', e);
    }
  }

  async function loadTopKeywords(days: number) {
    setSearchDays(days);
    try {
      const res: any = await getTopKeywords(10, days);
      setTopKeywords(res || []);
    } catch (e) {
      console.error('加载热门搜索词失败:', e);
    }
  }

  async function loadBounceRates() {
    try {
      const res: any = await getBounceRates(10, 7);
      setBounceRates(res || []);
    } catch (e) {
      console.error('加载跳出率失败:', e);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">核心分析 (Analysis)</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 热门页面排行 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="font-semibold text-lg text-slate-700">🔥 热门页面 TOP 20</h3>
            <select 
              value={pageDays} 
              onChange={(e) => loadTopPages(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500 w-fit"
            >
              <option value={1}>今天</option>
              <option value={7}>近 7 天</option>
              <option value={30}>近 30 天</option>
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-3 font-medium">排名</th>
                  <th className="p-3 font-medium">页面路径</th>
                  <th className="p-3 font-medium text-right">PV (浏览)</th>
                  <th className="p-3 font-medium text-right">UV (访客)</th>
                </tr>
              </thead>
              <tbody>
                {topPages.map((row: any, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50/60 text-sm">
                    <td className="p-3">
                      <span className={`inline-block w-6 h-6 text-center leading-6 rounded-full text-xs font-bold ${row.rank <= 3 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-blue-600 truncate max-w-[250px]" title={row.url}>{row.url}</td>
                    <td className="p-3 text-right">{row.pv?.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.uv?.toLocaleString()}</td>
                  </tr>
                ))}
                {topPages.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 浏览器分布 */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-slate-200/60 h-fit">
          <h3 className="font-semibold text-lg text-slate-700 mb-4">🌐 浏览器分布</h3>
          <PieChart data={browserData} name="browser" />
        </div>
      </div>

      {/* 搜索词 + OS分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热门搜索词 — 南丁格尔玫瑰图 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <h3 className="font-semibold text-lg text-slate-700">🔍 热门搜索词 TOP 10</h3>
            <select 
              value={searchDays} 
              onChange={(e) => loadTopKeywords(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-blue-500 w-fit"
            >
              <option value={1}>今天</option>
              <option value={7}>近 7 天</option>
              <option value={30}>近 30 天</option>
            </select>
          </div>
          <WordCloudChart data={topKeywords} />
          
          {/* 搜索词表格 */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-2.5 font-medium text-center">排名</th>
                  <th className="p-2.5 font-medium">搜索关键词</th>
                  <th className="p-2.5 font-medium text-right">搜索量</th>
                </tr>
              </thead>
              <tbody>
                {topKeywords.map((row: any, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50/60 text-sm">
                    <td className="p-2.5 text-center text-slate-500">{row.rank}</td>
                    <td className="p-2.5 font-medium">{row.keyword}</td>
                    <td className="p-2.5 text-right">{row.search_count?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OS 操作系统分布 (Feature 10) */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
          <h3 className="font-semibold text-lg text-slate-700 mb-4">💻 操作系统分布</h3>
          <PieChart data={osData} name="操作系统" />
        </div>
      </div>

      {/* 跳出率分析 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 跳出率柱状图 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
          <h3 className="font-semibold text-lg text-slate-700 mb-4">📊 高流失页面分析 (跳出率)</h3>
          <BounceChart data={bounceRates} />
        </div>

        {/* 跳出率明细表格 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
          <h3 className="font-semibold text-lg text-slate-700 mb-4">📋 跳出率明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-3 font-medium">入口页面</th>
                  <th className="p-3 font-medium text-right">访问次数</th>
                  <th className="p-3 font-medium text-right">跳出次数</th>
                  <th className="p-3 font-medium text-right">跳出率</th>
                </tr>
              </thead>
              <tbody>
                {bounceRates.map((row: any, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50/60 text-sm">
                    <td className="p-3 font-mono text-blue-600 truncate max-w-[200px]" title={row.url}>{row.url}</td>
                    <td className="p-3 text-right">{row.entry_count?.toLocaleString()}</td>
                    <td className="p-3 text-right">{row.bounce_count?.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${row.bounce_rate > 70 ? 'bg-red-100 text-red-700' : row.bounce_rate > 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                        {row.bounce_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {bounceRates.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-slate-400">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}