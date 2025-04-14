'use client';

import { UserService } from '@root/services/user';
import { User } from '@root/types/user';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps): React.JSX.Element {
  return (
    <aside className='bg-neutral flex flex-col justify-center items-center border-l border-r border-gray-300 py-10'>
      {children}
    </aside>
  );
}

export function LeftSideBar() {
  return (
    <SideBar>
      <h1 className='grow-1 text-4xl'>log4U</h1>
      <div className='grow-2'>
        <div className='flex items-center mb-2'>
          <Image src='/home.png' alt='home image' width={50} height={50} />
          <Link href='/'>
            <span className='p-5 text-2xl font-bold'>홈</span>
          </Link>
        </div>
        <div className='flex items-center mb-2'>
          <Image src='/search.png' alt='search image' width={50} height={50} />
          <Link href='/diaries/search'>
            <span className='p-5 text-2xl font-bold'>검색</span>
          </Link>
        </div>
        <div className='flex items-center mb-2'>
          <Image src='/add-diary.png' alt='add diary image' width={50} height={50} />
          <Link href='/diaries/new'>
            <span className='p-5 text-2xl font-bold'>만들기</span>
          </Link>
        </div>
        <div className='flex items-center mb-2'>
          <Image src='/mypage.png' alt='mypage image' width={50} height={50} />
          <Link href='/mypage'>
            <span className='p-5 text-2xl font-bold'>마이페이지</span>
          </Link>
        </div>
      </div>
    </SideBar>
  );
}

export function RightSideBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User.Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const hotUsers: string[] = [
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
    // 'winter',
  ];

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await UserService.getMe();
        setUser(userData);

        console.log(user);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await UserService.logout();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setIsDropdownOpen(false);
    }
  };

  const handleEditProfile = () => {
    router.push('/users/profile/edit');
    setIsDropdownOpen(false);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isDropdownOpen && !target.closest('.profile-dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <SideBar>
      <div className='grow-1'>
        <div className='flex items-center relative profile-dropdown-container'>
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className='flex items-center'>
            <div className='w-[50px] h-[50px] rounded-full overflow-hidden'>
              <img
                src={user?.profileImage ?? '/public/test-profile.svg'}
                alt={`${user?.name || '사용자'} 프로필 이미지`}
                width={50}
                height={50}
                className='w-full h-full object-cover'
              />
            </div>
            <span className='p-5 text-2xl font-bold'>
              {loading ? '로딩 중...' : user?.nickname || '사용자'}
            </span>
          </button>
          {isDropdownOpen && (
            <div className='absolute top-full left-0 mt-2 bg-white rounded-md shadow-lg z-10 w-40'>
              <button
                onClick={handleEditProfile}
                className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-200'
              >
                프로필 수정
              </button>
              <button
                onClick={handleLogout}
                className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
        <div>
          <div className='flex items-center'>
            <Image src={'/sun.png'} alt={'weather image'} width={50} height={50} />
            <span className='p-5 text-2xl font-bold'>6°C</span>
          </div>
          <div>서울특별시 강남구</div>
        </div>
      </div>
      <div className='grow-2'>
        <div className='flex items-center'>
          <Image src='/hot-logger.png' alt='hot logger image' width={50} height={50} />
          <span className={'p-5 text-xl font-bold'}>인기 로거</span>
        </div>
        {hotUsers.map((member, index) => (
          <div key={index} className='pl-4'>
            {index + 1}. {member}
          </div>
        ))}
      </div>
    </SideBar>
  );
}
