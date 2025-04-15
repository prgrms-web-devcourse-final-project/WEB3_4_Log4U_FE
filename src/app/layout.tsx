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
    // 로그인 페이지나 프로필 설정 페이지에서는 체크하지 않음
    const isLoginPage = pathname === '/login';
    const isProfileSetupPage = pathname === '/users/profile/new';

    if (isLoginPage || isProfileSetupPage) {
      console.log('로그인 페이지 또는 프로필 설정 페이지입니다. 유저 정보 체크를 건너뜁니다.');
      return;
    }

    console.log('유저 정보 및 프로필 설정 상태 확인 중...');

    axiosInstance
      .get<User.Me>('users/me')
      .then(response => {
        if (response.status !== 200) {
          console.log('유저 정보 조회 실패. 토큰 재발급 시도...');

          axiosInstance.get('/oauth2/token/reissue').then(response => {
            if (response.status !== 200) {
              console.log('토큰 재발급 실패. 로그인 페이지로 이동합니다.');
              router.push('/login');
            }
          });
        }

        // 프로필 설정 체크
        if (!response.data.profileImage || !response.data.nickname) {
          console.log('프로필 이미지 또는 닉네임이 설정되지 않았습니다:', {
            profileImage: response.data.profileImage,
            nickname: response.data.nickname,
          });
          console.log('프로필 설정 페이지로 리다이렉트합니다.');
          router.push('/users/profile/new');
        } else {
          console.log('유저 프로필이 정상적으로 설정되어 있습니다.');
        }
      })
      .catch(error => {
        console.error('유저 정보 조회 중 오류 발생:', error);
        console.log('로그인 페이지로 이동합니다.');
        router.push('/login');
      });
  }, [pathname, router]);

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
