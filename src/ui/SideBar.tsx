'use client';

import { UserService } from '@root/services/user';
import { User } from '@root/types/user';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { DiaryService } from '@root/services/diary';
import { Diary } from '@root/types/diary';
import { MapService } from '@root/services/map';

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
  // 현재 페이지 새로고침하는 함수
  const refreshPage = () => {
    window.location.reload();
  };

  // 현재 경로 확인을 위해 pathname 가져오기
  const [pathname, setPathname] = useState<string>('');

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  // 프로필 생성 페이지인지 확인
  const isProfileSetupPage = pathname === '/users/profile/new';

  // 링크 핸들러 - 프로필 설정 페이지에서는 이벤트 무시
  const handleNavigation = (e: React.MouseEvent) => {
    if (isProfileSetupPage) {
      e.preventDefault();
      e.stopPropagation();
      console.log('프로필 설정을 완료해야 이동할 수 있습니다.');
    }
  };

  return (
    <SideBar>
      <h1 className='grow-1 text-4xl cursor-pointer' onClick={refreshPage}>
        log4U
      </h1>
      <div className='grow-2'>
        <div
          className={`flex items-center mb-2 ${isProfileSetupPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Image src='/home.png' alt='home image' width={50} height={50} />
          <Link href={isProfileSetupPage ? '#' : '/'} onClick={handleNavigation}>
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
              홈
            </span>
          </Link>
        </div>
        <div
          className={`flex items-center mb-2 ${isProfileSetupPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Image src='/search.png' alt='search image' width={50} height={50} />
          <Link href={isProfileSetupPage ? '#' : '/diaries/search'} onClick={handleNavigation}>
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
              검색
            </span>
          </Link>
        </div>
        <div
          className={`flex items-center mb-2 ${isProfileSetupPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Image src='/add-diary.png' alt='add diary image' width={50} height={50} />
          <Link href={isProfileSetupPage ? '#' : '/diaries/new'} onClick={handleNavigation}>
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
              만들기
            </span>
          </Link>
        </div>
        <div
          className={`flex items-center mb-2 ${isProfileSetupPage ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Image src='/mypage.png' alt='mypage image' width={50} height={50} />
          <Link href={isProfileSetupPage ? '#' : '/mypage'} onClick={handleNavigation}>
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
              마이페이지
            </span>
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
  const [popularDiaries, setPopularDiaries] = useState<Diary.IPopularSummary[]>([]);
  const [loadingDiaries, setLoadingDiaries] = useState(true);
  const [locationInfo, setLocationInfo] = useState({
    sido: '서울특별시',
    sigungu: '강남구',
    eupmyeondong: '역삼동',
    temperature: '6°C',
    loading: true,
    error: false,
  });
  const router = useRouter();

  // 현재 경로 확인을 위해 pathname 가져오기
  const [pathname, setPathname] = useState<string>('');

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
    }
  }, []);

  // 프로필 생성 페이지인지 확인
  const isProfileSetupPage = pathname === '/users/profile/new';

  // 위치 정보 가져오기
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        setLocationInfo(prev => ({ ...prev, loading: true, error: false }));

        // 브라우저의 Geolocation API를 사용하여 현재 위치 가져오기

        navigator.geolocation.getCurrentPosition(
          async position => {
            try {
              const { latitude, longitude } = position.coords;

              // MapService를 사용하여 위치 정보 가져오기

              const geoData = await MapService.getGeolocation(latitude, longitude);

              if (geoData && geoData.results && geoData.results.length > 0) {
                const result = geoData.results[0];
                const sido = result.region.area1?.name || '알 수 없음';
                const sigungu = result.region.area2?.name || '알 수 없음';
                const eupmyeondong = result.region.area3?.name || '알 수 없음';

                // 위치 정보 상태 업데이트
                setLocationInfo(prev => ({
                  ...prev,
                  sido,
                  sigungu,
                  eupmyeondong,
                  loading: false,
                }));

                // 날씨 정보는 별도의 API가 필요하므로 여기서는 기존 값을 유지
              } else {
                throw new Error('위치 정보를 찾을 수 없습니다.');
              }
            } catch (error) {
              console.error('위치 정보 처리 중 오류 발생:', error);
              setLocationInfo(prev => ({ ...prev, loading: false, error: true }));
            }
          },
          error => {
            console.error(
              '위치 정보 가져오기 실패(권한 거부 또는 타임아웃):',
              error.code,
              error.message
            );
            setLocationInfo(prev => ({ ...prev, loading: false, error: true }));
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (error) {
        console.error('위치 정보 로드 실패(전체 프로세스):', error);
        setLocationInfo(prev => ({ ...prev, loading: false, error: true }));
      }
    };

    fetchLocationData();
  }, []);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userData = await UserService.getMe();
        setUser(userData);
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 인기 다이어리 가져오기
  useEffect(() => {
    const fetchPopularDiaries = async () => {
      try {
        setLoadingDiaries(true);
        const diariesData = await DiaryService.getPopularDiaries();
        setPopularDiaries(diariesData);
      } catch (error) {
        console.error('인기 다이어리 로드 실패:', error);
      } finally {
        setLoadingDiaries(false);
      }
    };

    fetchPopularDiaries();
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

  // 다이어리 클릭 핸들러
  const handleDiaryClick = (diaryId: number) => {
    router.push(`/diaries/${diaryId}`);
  };

  // 드롭다운 토글 핸들러 - 프로필 설정 페이지에서는 비활성화
  const toggleDropdown = () => {
    if (isProfileSetupPage) {
      console.log('프로필 설정을 완료해야 합니다.');
      return;
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // 다이어리 클릭 핸들러 - 프로필 설정 페이지에서는 비활성화
  const handleDiaryClickWrapper = (diaryId: number) => {
    if (isProfileSetupPage) {
      console.log('프로필 설정을 완료해야 다이어리를 볼 수 있습니다.');
      return;
    }
    handleDiaryClick(diaryId);
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
      <div className={`grow-1 ${isProfileSetupPage ? 'opacity-50' : ''}`}>
        <div className='flex items-center relative profile-dropdown-container'>
          <button
            onClick={toggleDropdown}
            className={`flex items-center ${isProfileSetupPage ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            disabled={isProfileSetupPage}
          >
            <div className='w-[50px] h-[50px] rounded-full overflow-hidden'>
              <img
                src={user?.profileImage ?? '/test-profile.svg'}
                alt={`${user?.name || '사용자'} 프로필 이미지`}
                width={50}
                height={50}
                className='w-full h-full object-cover'
              />
            </div>
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
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
            <span className={`p-5 text-2xl font-bold ${isProfileSetupPage ? 'text-gray-400' : ''}`}>
              {locationInfo.temperature}
            </span>
          </div>
          {locationInfo.loading ? (
            <div className='text-sm text-gray-500 ml-2'>위치 정보 로딩 중...</div>
          ) : locationInfo.error ? (
            <div className='text-sm text-gray-500 ml-2'>위치 정보를 가져올 수 없습니다</div>
          ) : (
            <div
              className={`text-lg font-medium ml-2 ${isProfileSetupPage ? 'text-gray-400' : ''}`}
            >
              {locationInfo.sido} {locationInfo.sigungu}
            </div>
          )}
        </div>
      </div>
      <div className={`grow-2 mt-8 ${isProfileSetupPage ? 'opacity-50' : ''}`}>
        <div className='flex items-center mb-6'>
          <Image src='/hot-logger.png' alt='hot logger image' width={50} height={50} />
          <span
            className={`p-5 text-xl font-bold ${isProfileSetupPage ? 'text-gray-400' : 'text-[var(--color-text)]'}`}
          >
            인기 다이어리
          </span>
        </div>

        {loadingDiaries ? (
          <div className='text-center p-4'>
            <div
              className='animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 mx-auto'
              style={{ borderColor: 'var(--color-primary)' }}
            ></div>
          </div>
        ) : popularDiaries.length > 0 ? (
          <div className='space-y-2 px-2'>
            {popularDiaries.map((diary, index) => (
              <div
                key={diary.diaryId}
                className={`relative overflow-hidden rounded-lg border-l-2 border-[var(--color-secondary)] bg-[#f9f7f5] ${
                  isProfileSetupPage ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#f5f0e8]'
                } transition-all duration-200 group`}
                onClick={() => handleDiaryClickWrapper(diary.diaryId)}
              >
                {/* 순위 표시 */}
                <div className='absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 flex items-center justify-center'>
                  <span
                    className={`font-medium ${isProfileSetupPage ? 'text-gray-400' : 'text-[var(--color-primary)]'}`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* 콘텐츠 */}
                <div className='py-3 px-12 pr-8'>
                  <h3
                    className={`font-medium truncate ${isProfileSetupPage ? 'text-gray-400' : 'text-[var(--color-text)]'}`}
                  >
                    {diary.title}
                  </h3>

                  {/* 화살표 아이콘 */}
                  <div
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                      isProfileSetupPage
                        ? 'opacity-30'
                        : 'opacity-50 group-hover:opacity-80 transition-opacity'
                    }`}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className={`h-4 w-4 ${isProfileSetupPage ? 'text-gray-400' : 'text-[var(--color-primary)]'}`}
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className={`text-center p-4 ${isProfileSetupPage ? 'text-gray-400 opacity-50' : 'text-[var(--color-text)] opacity-70'}`}
          >
            인기 다이어리가 없습니다
          </div>
        )}
      </div>
    </SideBar>
  );
}
