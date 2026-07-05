'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Server, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white relative overflow-hidden flex flex-col">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-3/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Image src="/logo.png" alt="web日志分析平台" width={40} height={40} className="rounded-lg" />
          <span className="text-xl font-bold tracking-wider">web日志分析平台</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">平台特性</Link>
          <Link href="#architecture" className="hover:text-white transition-colors">技术架构</Link>
          <Link href="#contact" className="hover:text-white transition-colors">联系我们</Link>
        </nav>
        <Link href="/dashboard">
          <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-5 py-2 rounded-full font-medium transition-all text-sm">
            进入控制台
          </button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center text-center px-6 py-20 mt-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Next.js Enterprise Edition v2.0
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 max-w-4xl leading-tight">
          洞察海量数据背后的 <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">业务增长密码</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          覆盖数据采集、清洗、存储到可视化分析的大数据全链路平台。秒级洞察访问趋势、高流失剖析与深层用户留存，助力数据驱动决策。
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold transition-all shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto shadow-blue-500/25">
              立即体验控制台
              <ArrowRight size={18} />
            </button>
          </Link>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <button className="bg-white/5 hover:bg-white/10 text-white border border-slate-700 px-8 py-4 rounded-full font-semibold transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
              查看开发文档
            </button>
          </a>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full text-left">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:translate-y-[-5px] transition-transform">
            <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-6">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">PB级别秒级响应</h3>
            <p className="text-slate-400 text-sm leading-relaxed">通过 Kafka 高吞吐缓冲与 DWS/ADS 层轻度汇总模型，应对海量请求的交互式页面能够实现秒级无感快速渲染。</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:translate-y-[-5px] transition-transform">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">全链路数据闭环</h3>
            <p className="text-slate-400 text-sm leading-relaxed">从 Flume 源头采集拦截到 DolphinScheduler 集群调度，内置超过 12 项业务核心漏斗分析及安全告警策略阈值。</p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:translate-y-[-5px] transition-transform">
            <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6">
              <Server size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">灵活现代可视化</h3>
            <p className="text-slate-400 text-sm leading-relaxed">基于 React 18 与 Next.js App Router 深度重构。提供直观的用户留存分析、高价值终端设备分布及路由跳出捕捉。</p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-slate-800 py-8 text-center text-slate-500 text-sm mt-8">
        &copy; {new Date().getFullYear()} web日志分析平台. 覆盖日志采集 → 数据清洗 → 数据分析 → 数据可视化全链路.
      </footer>
    </div>
  );
}
