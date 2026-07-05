'use client';

import React from 'react';
import { Server, Cpu, HardDrive, Network, Database, Layers, BarChart3 } from 'lucide-react';

// HDFS 分区模拟数据
const HDFS_PARTITIONS = [
  { date: '2026-07-03', size: '2.1 GB', files: 156, status: 'complete' },
  { date: '2026-07-02', size: '1.8 GB', files: 142, status: 'complete' },
  { date: '2026-07-01', size: '2.3 GB', files: 168, status: 'complete' },
  { date: '2026-06-30', size: '1.9 GB', files: 151, status: 'complete' },
  { date: '2026-06-29', size: '2.0 GB', files: 149, status: 'complete' },
];

// Kafka Topic 状态
const KAFKA_TOPICS = [
  { topic: 'log_raw', partitions: 3, replicas: 2, messages: '12.4M', lag: 0, status: 'healthy' },
  { topic: 'log_parsed', partitions: 3, replicas: 2, messages: '12.4M', lag: 0, status: 'healthy' },
  { topic: 'log_errors', partitions: 1, replicas: 2, messages: '1.2K', lag: 0, status: 'healthy' },
];

export default function ClusterPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">系统资源 (Cluster Status)</h2>
        <p className="text-slate-500 mt-2 text-sm">监控底层大数据组件运行状态、节点负载及集群健康度。</p>
      </div>

      {/* 总览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-slate-200/60 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <Server size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Nodes</p>
            <p className="text-2xl font-bold text-slate-800">5 / 5</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-slate-200/60 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">CPU Usage</p>
            <p className="text-2xl font-bold text-slate-800">32%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-slate-200/60 flex items-center space-x-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <HardDrive size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">HDFS Capacity</p>
            <p className="text-2xl font-bold text-slate-800">12.4 TB</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 md:p-6 border border-slate-200/60 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Network size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Network I/O</p>
            <p className="text-2xl font-bold text-slate-800">850 MB/s</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HDFS 分区存储 (Feature 3) */}
        <div className="bg-white rounded-xl shadow-sm p-7 border border-slate-200/60">
          <div className="flex items-center gap-2 mb-5">
            <Layers size={20} className="text-blue-600" />
            <h3 className="font-bold text-lg text-slate-800">HDFS 日期分区一览</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">按日期 (dt=YYYY-MM-DD) 分区存储，避免全表扫描。</p>
          <div className="space-y-3">
            {HDFS_PARTITIONS.map((p, i) => {
              const widthPct = 60 + Math.random() * 40; // 模拟柱宽
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm font-mono text-slate-600 w-24 flex-shrink-0">{p.date}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="text-[10px] text-white font-semibold">{p.size}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 w-16 text-right flex-shrink-0">{p.files} files</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kafka Topic 消费状态 (Feature 2) */}
        <div className="bg-white rounded-xl shadow-sm p-7 border border-slate-200/60">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={20} className="text-orange-600" />
            <h3 className="font-bold text-lg text-slate-800">Kafka Topic 状态</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4">消息队列削峰缓冲，防止高峰期冲垮后端存储。</p>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b">
                  <th className="p-3 font-semibold">Topic</th>
                  <th className="p-3 font-semibold text-center">Partitions</th>
                  <th className="p-3 font-semibold text-right">消息总量</th>
                  <th className="p-3 font-semibold text-center">Lag</th>
                  <th className="p-3 font-semibold text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {KAFKA_TOPICS.map((t, i) => (
                  <tr key={i} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono text-slate-700">{t.topic}</td>
                    <td className="p-3 text-center text-slate-600">{t.partitions}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{t.messages}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${t.lag === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {t.lag}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Healthy
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 服务拓扑状态 */}
      <div className="bg-white rounded-xl shadow-sm p-7 border border-slate-200/60">
        <h3 className="font-bold text-lg text-slate-800 mb-6">服务拓扑状态</h3>
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left bg-white border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                <th className="p-4 font-semibold">服务组件</th>
                <th className="p-4 font-semibold">角色</th>
                <th className="p-4 font-semibold text-center">实例数量</th>
                <th className="p-4 font-semibold">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { name: 'Hadoop (HDFS)', role: 'Storage Node', count: 3, status: 'Healthy' },
                { name: 'Apache Spark', role: 'Compute Engine', count: 2, status: 'Healthy' },
                { name: 'Apache Kafka', role: 'Message Queue', count: 3, status: 'Healthy' },
                { name: 'Apache Hive', role: 'Data Warehouse', count: 1, status: 'Healthy' },
                { name: 'MySQL', role: 'Metadata & ADS', count: 1, status: 'Healthy' },
                { name: 'FastAPI Backend', role: 'API Service', count: 1, status: 'Healthy' },
              ].map((item, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="p-4 font-medium text-slate-800">{item.name}</td>
                  <td className="p-4 text-slate-500">{item.role}</td>
                  <td className="p-4 text-center text-slate-600">{item.count}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}