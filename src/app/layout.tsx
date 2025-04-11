import { LeftSideBar, RightSideBar } from '@/ui/SideBar';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='bg-neutral h-screen text-text box-border'>
          <div className='h-full w-full grid grid-cols-[280px_1fr_280px] gap-4'>
            <LeftSideBar></LeftSideBar>
            {children}
            <RightSideBar></RightSideBar>
          </div>
        </div>
      </body>
    </html>
  );
}
