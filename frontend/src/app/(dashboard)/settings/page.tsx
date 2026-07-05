'use client';

import React from 'react';
import { User, Bell, Lock, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">管理设置 (Settings)</h2>
        <p className="text-slate-500 mt-2 text-sm">调整平台告警阈值、权限角色及全局参数。</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 ring-1 ring-black/5 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200">
          <nav className="flex flex-col p-4 space-y-1">
            <button className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 font-medium rounded-lg transition-colors text-sm">
              <Bell size={18} />
              告警设定
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors text-sm border border-transparent">
              <User size={18} />
              用户与角色
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors text-sm border border-transparent">
              <Lock size={18} />
              安全策略
            </button>
            <button className="flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg transition-colors text-sm border border-transparent">
              <Globe size={18} />
              系统偏好
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-8">
          <h3 className="font-bold text-xl text-slate-800 border-b border-slate-100 pb-4 mb-6">告警设定 (Alert Configuration)</h3>
          
          <div className="space-y-6">
            <div className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <div>
                <h4 className="font-medium text-slate-800">高跳出率告警</h4>
                <p className="text-sm text-slate-500 mt-1">当某核心页面（入口量 &gt; 100）跳出率超过阈值时通过钉钉推送报警。</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={75} className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                <span className="text-sm text-slate-500">%</span>
                <div className="ml-2 w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="flex items-start justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
              <div>
                <h4 className="font-medium text-slate-800">采集延迟 (Flume/Kafka Lag)</h4>
                <p className="text-sm text-slate-500 mt-1">底层消息队列或 HDFS 写入延迟超标时发送邮件警告。</p>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={5} className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500" />
                <span className="text-sm text-slate-500">Mins</span>
                <div className="ml-2 w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer shadow-inner">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors shadow-sm text-sm">
                保存修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}