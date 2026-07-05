export default function TopHeader() {
  return (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
      <div className="flex items-center text-sm">
        <span className="text-slate-500 mr-2">环境状态:</span>
        <span className="flex items-center gap-1.5 text-emerald-600 font-medium bg-emerald-50 px-2.5 py-1 rounded-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          生产环境 (Production)
        </span>
      </div>
      
      <div className="flex items-center gap-6 text-sm">
        <div className="text-slate-500">
           最后同步: <span className="font-semibold text-slate-700 ml-1 block sm:inline">2 分钟前</span>
        </div>
      </div>
    </header>
  );
}
