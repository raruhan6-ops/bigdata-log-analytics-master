import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css'; // Changed back to correct path

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'web日志分析平台',
  description: '覆盖日志采集、清洗、存储到可视化分析的大数据全链路平台',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${jakarta.className} antialiased bg-slate-50 min-h-screen text-slate-800`}>
        {children}
      </body>
    </html>
  );
}
