'use client';

import { FC, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@root/services/user';

type SSOProviderType = 'naver' | 'kakao' | 'google';

function SSOAuth(provider: 'naver' | 'kakao' | 'google') {
  return `/oauth2/authorization/${provider}`;
}

const LoginPage: FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        // users/me API 호출
        const userData = await UserService.getMe();

        // 사용자 정보가 존재하면 (로그인된 상태)
        if (userData && userData.userId) {
          console.log('이미 로그인된 상태입니다:', userData.nickname || userData.userId);
          // 홈 페이지로 리다이렉트
          router.push('/');
          return;
        }
      } catch (error) {
        console.log('로그인 상태가 아닙니다:', error);
        // 오류 발생 시 로그인 페이지 유지 (로그인되지 않은 상태)
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [router]);

  const handleSocialLogin = async (provider: SSOProviderType) => {
    // 실제 소셜 로그인 로직 구현
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SSOAuth(provider)}`;

    alert(`${provider} 소셜 로그인`);
  };

  // 로딩 중 UI
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-[#f9f3eb]'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-[#f9f3eb]'>
      <div className='max-w-sm w-full bg-white shadow-md rounded p-6'>
        {/* 로고 영역 */}
        <h1 className='text-2xl font-bold text-center mb-6'>log4U</h1>

        {/* 소셜 로그인 버튼들 */}
        <div className='flex flex-col space-y-2'>
          <button
            onClick={() => handleSocialLogin('naver')}
            className='bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700'
          >
            네이버로 로그인
          </button>
          <button
            onClick={() => handleSocialLogin('kakao')}
            className='bg-yellow-400 text-black py-2 rounded font-medium hover:bg-yellow-500'
          >
            카카오로 로그인
          </button>
          <button
            onClick={() => handleSocialLogin('google')}
            className='bg-white border border-gray-300 py-2 rounded font-medium hover:bg-gray-100'
          >
            구글로 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
