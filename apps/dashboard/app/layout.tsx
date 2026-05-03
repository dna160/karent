import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Karent — AI Influencer Pipeline',
  description: 'PERSONA ENGINE operator dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-bg-base text-white min-h-screen flex">
        {/* Fixed left sidebar */}
        <aside className="w-60 min-h-screen bg-bg-sidebar border-r border-bg-border flex-shrink-0 fixed top-0 left-0 z-30">
          <Sidebar />
        </aside>

        {/* Main content — offset by sidebar width */}
        <main className="ml-60 flex-1 min-h-screen overflow-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
