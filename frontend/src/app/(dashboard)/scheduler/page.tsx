'use client';

import React, { useEffect, useState } from 'react';
import { getSchedulerJobs, getJobLogs } from '@/api/scheduler';
import { RefreshCw, Play, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, Workflow } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  SUCCESS: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  RUNNING: { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Play },
  WAITING: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  FAILED: { color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: XCircle },
  UNKNOWN: { color: 'text-slate-500', bg: 'bg-slate-50 border-slate-200', icon: AlertTriangle },
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-slate-100 text-slate-600',
};

// DAG 流水线定义
const DAG_NODES = [
  { id: 'flume', label: 'Flume 采集', type: 'source' },
  { id: 'kafka', label: 'Kafka 缓冲', type: 'queue' },
  { id: 'hdfs', label: 'HDFS 存储', type: 'storage' },
  { id: 'ods', label: 'ODS 原始层', type: 'dw' },
  { id: 'dwd', label: 'DWD 明细层', type: 'dw' },
  { id: 'dws', label: 'DWS 汇总层', type: 'dw' },
  { id: 'ads', label: 'ADS 应用层', type: 'dw' },
  { id: 'mysql', label: 'MySQL 同步', type: 'output' },
];

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [jobLogs, setJobLogs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    setLoading(true);
    try {
      const res: any = await getSchedulerJobs();
      setJobs(res || []);
    } catch (e) {
      console.error('加载调度任务失败:', e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleJobLogs(jobId: string) {
    if (expandedJob === jobId) {
      setExpandedJob(null);
      setJobLogs(null);
      return;
    }
    setExpandedJob(jobId);
    try {
      const res: any = await getJobLogs(jobId);
      setJobLogs(res);
    } catch (e) {
      console.error('加载执行日志失败:', e);
    }
  }

  const successCount = jobs.filter((j) => j.latest_status === 'SUCCESS').length;
  const failCount = jobs.filter((j) => j.latest_status === 'FAILED').length;
  const runningCount = jobs.filter((j) => j.latest_status === 'RUNNING').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">任务调度中心 (Scheduler)</h2>
          <p className="text-slate-500 mt-2 text-sm">全链路 ETL 数仓流水线调度管理，支持 Cron 定时、失败重试与告警通知。</p>
        </div>
        <button onClick={loadJobs} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm text-sm font-medium w-fit">
          <RefreshCw size={16} /> 刷新状态
        </button>
      </div>

      {/* DAG 拓扑图 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm p-6 border border-slate-200/60">
        <div className="flex items-center gap-2 mb-5">
          <Workflow size={20} className="text-blue-600" />
          <h3 className="font-bold text-lg text-slate-800">数据流水线 DAG 拓扑</h3>
        </div>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {DAG_NODES.map((node, i) => (
            <React.Fragment key={node.id}>
              <div className="flex flex-col items-center min-w-[80px] md:min-w-[100px]">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-md ${
                  node.type === 'source' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' :
                  node.type === 'queue' ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                  node.type === 'storage' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                  node.type === 'dw' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                  'bg-gradient-to-br from-pink-500 to-rose-600'
                }`}>
                  {node.label.slice(0, 2)}
                </div>
                <span className="mt-2 text-xs text-slate-600 font-medium text-center whitespace-nowrap">{node.label}</span>
              </div>
              {i < DAG_NODES.length - 1 && (
                <div className="flex-shrink-0 w-6 md:w-10 h-0.5 bg-gradient-to-r from-slate-300 to-slate-400 mx-1 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-slate-400 border-y-[4px] border-y-transparent" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-200/60">
          <p className="text-sm text-slate-500 font-medium">总任务数</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{jobs.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-emerald-200/60">
          <p className="text-sm text-emerald-600 font-medium">✅ 成功</p>
          <p className="text-3xl font-bold text-emerald-700 mt-1">{successCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-blue-200/60">
          <p className="text-sm text-blue-600 font-medium">🔄 运行中</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">{runningCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border border-red-200/60">
          <p className="text-sm text-red-600 font-medium">❌ 失败</p>
          <p className="text-3xl font-bold text-red-700 mt-1">{failCount}</p>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">调度任务列表</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-slate-400">加载中...</div>
          ) : jobs.map((job) => {
            const statusConf = STATUS_CONFIG[job.latest_status] || STATUS_CONFIG.UNKNOWN;
            const StatusIcon = statusConf.icon;
            const isExpanded = expandedJob === job.job_id;

            return (
              <div key={job.job_id}>
                <div
                  className="p-5 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  onClick={() => toggleJobLogs(job.job_id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg border ${statusConf.bg}`}>
                        <StatusIcon size={20} className={statusConf.color} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800">{job.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{job.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_COLORS[job.priority] || 'bg-slate-100 text-slate-500'}`}>
                        {job.priority}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {job.engine}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        Cron: {job.cron}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${statusConf.bg} ${statusConf.color}`}>
                        {job.latest_status}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>
                  {job.latest_run_time && (
                    <p className="text-xs text-slate-400 mt-2 ml-14">
                      最近执行: {job.latest_run_time} · 耗时: {job.latest_duration_sec}s
                    </p>
                  )}
                </div>

                {/* 展开日志 */}
                {isExpanded && jobLogs && (
                  <div className="px-5 pb-5 bg-slate-50/40">
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="p-3 font-semibold">执行 ID</th>
                            <th className="p-3 font-semibold">开始时间</th>
                            <th className="p-3 font-semibold">结束时间</th>
                            <th className="p-3 font-semibold text-right">耗时 (s)</th>
                            <th className="p-3 font-semibold text-right">处理记录数</th>
                            <th className="p-3 font-semibold text-center">状态</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(jobLogs.runs || []).map((run: any) => {
                            const runConf = STATUS_CONFIG[run.status] || STATUS_CONFIG.UNKNOWN;
                            return (
                              <tr key={run.run_id} className="hover:bg-slate-50/60">
                                <td className="p-3 font-mono text-xs text-slate-600">{run.run_id}</td>
                                <td className="p-3 text-slate-700">{run.start_time}</td>
                                <td className="p-3 text-slate-700">{run.end_time}</td>
                                <td className="p-3 text-right font-mono">{run.duration_sec}</td>
                                <td className="p-3 text-right font-mono">{run.records_processed?.toLocaleString()}</td>
                                <td className="p-3 text-center">
                                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${runConf.bg} ${runConf.color}`}>
                                    {run.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 告警设置提示 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl shadow-sm p-6 border border-amber-200/60">
        <div className="flex items-start gap-4">
          <AlertTriangle size={24} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-amber-800">告警通知配置</h4>
            <p className="text-sm text-amber-700 mt-1">
              当任务执行失败时，系统会通过钉钉 WebHook 和邮件发送告警通知。可在
              <a href="/settings" className="underline font-medium"> 管理设置 </a>
              中配置告警阈值和通知渠道。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
