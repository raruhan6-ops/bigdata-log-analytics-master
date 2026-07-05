'use client';

import React, { useState } from 'react';
import { FileDown, RefreshCw, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

// 数据链路节点
const PIPELINE_NODES = [
  { id: 'nginx', label: 'Nginx 日志', desc: '/var/log/nginx/access.log', status: 'active', color: 'from-green-500 to-emerald-600' },
  { id: 'flume', label: 'Flume 采集', desc: 'Taildir Source → File Channel', status: 'active', color: 'from-emerald-500 to-teal-600' },
  { id: 'kafka', label: 'Kafka 缓冲', desc: 'Topic: log_raw (3 partitions)', status: 'active', color: 'from-orange-500 to-amber-600' },
  { id: 'hdfs', label: 'HDFS 存储', desc: '/data/log_dw/ods/dt=YYYY-MM-DD', status: 'active', color: 'from-blue-500 to-indigo-600' },
  { id: 'hive', label: 'Hive 数仓', desc: 'ODS → DWD → DWS → ADS', status: 'active', color: 'from-purple-500 to-violet-600' },
  { id: 'mysql', label: 'MySQL 应用', desc: 'ADS 指标同步 → FastAPI', status: 'active', color: 'from-pink-500 to-rose-600' },
];

// 数仓分层
const DW_LAYERS = [
  { name: 'ODS 原始层', desc: '外部表挂载 HDFS 原始日志', tables: 'ods_access_log', color: 'bg-slate-100 border-slate-300 text-slate-700' },
  { name: 'DWD 明细层', desc: '清洗、解析、标记终端/浏览器/OS', tables: 'dwd_page_view, dwd_session', color: 'bg-blue-50 border-blue-300 text-blue-700' },
  { name: 'DWS 汇总层', desc: '小时级/日级轻度聚合', tables: 'dws_pv_uv_hourly, dws_page_rank_daily', color: 'bg-indigo-50 border-indigo-300 text-indigo-700' },
  { name: 'ADS 应用层', desc: 'KPI 宽表、跳出率、留存率', tables: 'ads_kpi_daily, ads_page_bounce_rate', color: 'bg-purple-50 border-purple-300 text-purple-700' },
];

export default function SourcesPage() {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">数据源设定 (Sources)</h2>
          <p className="text-slate-500 mt-2 text-sm">管理日志采集接入点、ETL 清洗规则流及数仓分层架构。</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm w-fit">
          <Layers size={18} />
          新建数据流接入
        </button>
      </div>

      {/* 全链路数据流动画 (Feature 1-3) */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-slate-200/60">
        <h3 className="font-bold text-lg text-slate-800 mb-6">📡 全链路数据流 (实时)</h3>
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 overflow-x-auto pb-2">
          {PIPELINE_NODES.map((node, i) => (
            <React.Fragment key={node.id}>
              <div className="flex-1 min-w-[140px]">
                <div className={`relative bg-gradient-to-br ${node.color} rounded-xl p-4 text-white shadow-lg hover:scale-105 transition-transform cursor-default`}>
                  <div className="absolute top-2 right-2">
                    <span className="flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                    </span>
                  </div>
                  <p className="font-bold text-sm">{node.label}</p>
                  <p className="text-xs opacity-80 mt-1 leading-relaxed">{node.desc}</p>
                </div>
              </div>
              {i < PIPELINE_NODES.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-8 flex-shrink-0">
                  <ArrowRight size={18} className="text-slate-400 animate-pulse" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 数仓分层架构 (Feature 4) */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-slate-200/60">
        <h3 className="font-bold text-lg text-slate-800 mb-6">🏗️ 离线数仓 ETL 分层架构</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {DW_LAYERS.map((layer, i) => (
            <div
              key={i}
              className={`p-5 rounded-xl border-2 ${layer.color} cursor-pointer transition-all hover:shadow-md ${selectedLayer === i ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
              onClick={() => setSelectedLayer(selectedLayer === i ? null : i)}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="opacity-60" />
                <h4 className="font-bold text-sm">{layer.name}</h4>
              </div>
              <p className="text-xs opacity-75 mb-3">{layer.desc}</p>
              <div className="text-xs font-mono opacity-60">{layer.tables}</div>
              {i < DW_LAYERS.length - 1 && (
                <div className="hidden md:block text-center mt-3">
                  <span className="text-lg">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 活跃采集通道 */}
        <div className="bg-white rounded-xl shadow-sm p-7 border border-slate-200/60">
          <h3 className="font-bold text-lg text-slate-800 mb-2">活跃采集通道</h3>
          <p className="text-sm text-slate-500 mb-6">当前正在实时监听的 Web Server 日志路径</p>
          
          <div className="space-y-4">
            {[
              { id: 'FLUME-Nginx-01', path: '/var/log/nginx/access.log', type: 'Taildir', target: 'Kafka (topic: web_logs)' },
              { id: 'FLUME-Tomcat-02', path: '/opt/tomcat/logs/catalina.out', type: 'Taildir', target: 'Kafka (topic: app_logs)' }
            ].map((source, i) => (
              <div key={i} className="flex border border-slate-200 p-4 rounded-lg bg-slate-50 hover:bg-white hover:border-blue-300 transition-all">
                <div className="mr-4 mt-1 p-2 bg-blue-100 text-blue-600 rounded-md">
                   <FileDown size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold text-slate-800">{source.id}</h4>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Running</span>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p><span className="font-medium text-slate-700">Source:</span> <code className="bg-slate-200 px-1 rounded text-xs">{source.path}</code> ({source.type})</p>
                    <p><span className="font-medium text-slate-700">Target:</span> {source.target}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 离线清洗作业 */}
        <div className="bg-white rounded-xl shadow-sm p-7 border border-slate-200/60">
          <h3 className="font-bold text-lg text-slate-800 mb-2">离线清洗作业 (ETL Jobs)</h3>
          <p className="text-sm text-slate-500 mb-6">每日定时调度的 Hive/Spark DWD 数据抽取状态</p>

          <div className="space-y-4">
            {[
              { name: 'ODS -> DWD Sessionization', engine: 'Spark SQL', schedule: '02:00 AM', status: 'Success', lastRun: 'Today 02:15 AM' },
              { name: 'DWD -> DWS Hourly Aggregation', engine: 'Hive', schedule: 'Hourly @ :15', status: 'Success', lastRun: 'Today 14:15 PM' },
              { name: 'DWS -> ADS Daily Extract', engine: 'Hive', schedule: '04:00 AM', status: 'Success', lastRun: 'Today 04:30 AM' },
            ].map((job, i) => (
              <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-slate-100 text-slate-500 rounded-md">
                     <RefreshCw size={16} />
                   </div>
                   <div>
                     <p className="font-medium text-slate-800 text-sm">{job.name}</p>
                     <p className="text-xs text-slate-500">{job.engine} · 调度: {job.schedule}</p>
                   </div>
                </div>
                <div className="text-right">
                   <span className="text-xs font-semibold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded border border-emerald-100">{job.status}</span>
                   <p className="text-xs text-slate-400 mt-1">{job.lastRun}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}