'use client';

import { LeftSideBar, RightSideBar } from '@/ui/SideBar';
import { Geist, Geist_Mono } from 'next/font/google';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { axiosInstance } from '../../services/axios.instance';
import './globals.css';
import { User } from '@root/types/user';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface LayoutProps {
  children: React.ReactNode;
  // modal: React.ReactNode;
}

export default function RootLayout({ children }: LayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    axiosInstance
      .get<User.Me>('users/me')
      .then(response => {
        if (response.status !== 200) {
          axiosInstance.get('/oauth2/token/reissue').then(response => {
            if (response.status !== 200) {
              router.push('/login');
            }
          });
        }

        // 302 상태코드 해결되기 전까지 주석유지
        // if (!response.data.profileImage || !response.data.nickname) {
        //   router.push('/users/profile/new');
        // }
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
