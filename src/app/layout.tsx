'use client';

import { LeftSideBar, RightSideBar } from '@/ui/SideBar';
import { Geist, Geist_Mono } from 'next/font/google';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { axiosInstance } from '../../services/axios.instance';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    axiosInstance
      .get('users/me')
      .then(response => {
        if (response.status !== 200) {
          axiosInstance.get('/oauth2/token/reissue').then(response => {
            if (response.status !== 200) {
              router.push('/login');
            }
          });
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, []);

  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className='bg-neutral h-screen text-text box-border'>
          {pathname === '/login' ? (
            <div className='h-full w-full grid grid-cols-[280px_1fr_280px] gap-4'>
              <div></div>
              {children}
              <div></div>
            </div>
          ) : (
            <div className='h-full w-full grid grid-cols-[280px_1fr_280px] gap-4'>
              <LeftSideBar></LeftSideBar>
              {children}
              <RightSideBar></RightSideBar>
            </div>
          )}
        </div>
      </body>
    </html>
  );
}
