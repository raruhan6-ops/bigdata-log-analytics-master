import SideNav from '@/components/SideNav';
import TopHeader from '@/components/TopHeader';

export const metadata = {
  title: 'web日志分析平台 — 控制台',
  description: '大数据离线日志分析平台控制台',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <SideNav />
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="p-4 md:p-8 flex-grow overflow-x-hidden">
          <div className="w-full max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
