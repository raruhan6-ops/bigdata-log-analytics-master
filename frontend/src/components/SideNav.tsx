'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, BarChart2, Database, Settings, Activity, CalendarClock, SearchCode, Menu, X } from 'lucide-react';

const navigation = [
  { name: '大盘概览 (Dashboard)', href: '/dashboard', icon: LayoutDashboard },
  { name: '核心分析 (Analysis)', href: '/analysis', icon: BarChart2 },
  { name: '系统资源 (Cluster)', href: '/cluster', icon: Activity },
  { name: '数据源设定 (Sources)', href: '/sources', icon: Database },
  { name: '任务调度 (Scheduler)', href: '/scheduler', icon: CalendarClock },
  { name: '交互查询 (Drill-down)', href: '/drilldown', icon: SearchCode },
  { name: '管理设置 (Settings)', href: '/settings', icon: Settings },
];

export default function SideNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="h-16 flex items-center px-5 border-b border-slate-200 mb-6 shrink-0">
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <h1 className="text-base font-bold text-slate-800 tracking-wider flex items-center gap-2.5 hover:opacity-80 transition-opacity cursor-pointer">
             <Image src="/logo.png" alt="web日志分析平台" width={32} height={32} className="rounded-md" />
             <span>web日志分析平台</span>
          </h1>
        </Link>
      </div>
      
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">主要菜单</div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100 font-semibold' 
                  : 'hover:bg-slate-50 hover:text-blue-600 text-slate-600'
              }`}
            >
              <item.icon size={19} className={isActive ? "text-blue-600" : "text-slate-400"} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 shadow-sm flex items-center justify-center text-white text-sm font-bold">
              AD
            </div>
            <div>
               <p className="text-sm text-slate-800 font-bold leading-tight">Admin User</p>
               <p className="text-xs text-slate-500 mt-0.5">Data Scientist</p>
            </div>
         </div>
      </div>
    </>
  );
  
  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200"
        aria-label="打开菜单"
      >
        <Menu size={22} className="text-slate-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} 
        />
      )}

      {/* Mobile drawer */}
      <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white text-slate-600 flex flex-col shadow-2xl transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="关闭菜单"
        >
          <X size={20} className="text-slate-500" />
        </button>
        {navContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white text-slate-600 h-screen sticky top-0 shrink-0 shadow-lg border-r border-slate-200">
        {navContent}
      </div>
    </>
  );
}
