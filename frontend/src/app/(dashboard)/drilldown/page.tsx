'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { drilldownQuery, DrilldownParams } from '@/api/drilldown';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown, Database } from 'lucide-react';

export default function DrilldownPage() {
  const [filters, setFilters] = useState<DrilldownParams>({
    days: 7,
    url_path: '',
    terminal: '',
    browser: '',
    page: 1,
    page_size: 20,
    sort_by: 'pv',
    sort_order: 'desc',
  });

  const [result, setResult] = useState<any>({ summary: {}, details: [], pagination: {} });
  const [loading, setLoading] = useState(false);

  const doQuery = useCallback(async (params: DrilldownParams) => {
    setLoading(true);
    try {
      const res: any = await drilldownQuery(params);
      setResult(res || { summary: {}, details: [], pagination: {} });
    } catch (e) {
      console.error('下钻查询失败:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    doQuery(filters);
  }, []);

  function handleSearch() {
    const newFilters = { ...filters, page: 1 };
    setFilters(newFilters);
    doQuery(newFilters);
  }

  function handlePageChange(dir: number) {
    const newPage = (filters.page || 1) + dir;
    if (newPage < 1) return;
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    doQuery(newFilters);
  }

  function handleSort(field: string) {
    const newOrder = filters.sort_by === field && filters.sort_order === 'desc' ? 'asc' : 'desc';
    const newFilters = { ...filters, sort_by: field, sort_order: newOrder, page: 1 };
    setFilters(newFilters);
    doQuery(newFilters);
  }

  const summary = result.summary || {};
  const details = result.details || [];
  const pagination = result.pagination || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">交互式下钻查询 (Drill-down)</h2>
        <p className="text-slate-500 mt-2 text-sm">多维度筛选条件组合查询，支持按日期、页面、终端、浏览器自由切换。</p>
      </div>

      {/* 筛选面板 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-slate-200/60">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">筛选条件</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">时间范围</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={1}>今天</option>
              <option value={7}>近 7 天</option>
              <option value={14}>近 14 天</option>
              <option value={30}>近 30 天</option>
              <option value={90}>近 90 天</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">页面路径</label>
            <input
              type="text"
              placeholder="如: /product, /login"
              value={filters.url_path}
              onChange={(e) => setFilters({ ...filters, url_path: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">终端类型</label>
            <select
              value={filters.terminal}
              onChange={(e) => setFilters({ ...filters, terminal: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="PC">PC</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">浏览器</label>
            <select
              value={filters.browser}
              onChange={(e) => setFilters({ ...filters, browser: e.target.value })}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="">全部</option>
              <option value="Chrome">Chrome</option>
              <option value="Firefox">Firefox</option>
              <option value="Safari">Safari</option>
              <option value="Edge">Edge</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
            >
              <Search size={16} /> {loading ? '查询中...' : '执行查询'}
            </button>
          </div>
        </div>
      </div>

      {/* 聚合小结 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200/60 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">匹配记录数</p>
            <p className="text-2xl font-bold text-slate-800">{(summary.total_records || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200/60 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">总 PV</p>
            <p className="text-2xl font-bold text-slate-800">{(summary.total_pv || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200/60 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Database size={22} />
          </div>
          <div>
            <p className="text-sm text-slate-500">总 UV</p>
            <p className="text-2xl font-bold text-slate-800">{(summary.total_uv || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 明细表格 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                {[
                  { key: 'dt', label: '日期' },
                  { key: 'page_url', label: '页面路径' },
                  { key: 'pv', label: 'PV' },
                  { key: 'uv', label: 'UV' },
                ].map((col) => (
                  <th
                    key={col.key}
                    className={`p-4 font-semibold cursor-pointer hover:text-blue-600 transition-colors select-none ${col.key === 'pv' || col.key === 'uv' ? 'text-right' : ''}`}
                    onClick={() => handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <ArrowUpDown size={14} className={filters.sort_by === col.key ? 'text-blue-600' : 'text-slate-300'} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-400">查询中...</td></tr>
              ) : details.length === 0 ? (
                <tr><td colSpan={4} className="p-12 text-center text-slate-400">无匹配数据，请调整筛选条件</td></tr>
              ) : details.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-blue-50/40 transition-colors">
                  <td className="p-4 text-sm font-medium text-slate-700">{row.dt}</td>
                  <td className="p-4 text-sm font-mono text-blue-600 max-w-[300px] truncate" title={row.page_url}>{row.page_url}</td>
                  <td className="p-4 text-sm text-right font-mono text-slate-700">{row.pv?.toLocaleString()}</td>
                  <td className="p-4 text-sm text-right font-mono text-slate-700">{row.uv?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100">
          <span className="text-sm text-slate-500">
            第 {pagination.page || 1} 页 · 每页 {pagination.page_size || 20} 条
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(-1)}
              disabled={(filters.page || 1) <= 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
              {pagination.page || 1}
            </span>
            <button
              onClick={() => handlePageChange(1)}
              disabled={!pagination.has_more}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
