'use client';

import { useEffect, useState } from 'react';
import { UserService } from '@root/services/user';
import { DiaryService } from '@root/services/diary';
import { FollowService } from '@root/services/follow';
import { SupportService } from '@root/services/support';
import { User } from '@root/types/user';
import { Diary } from '@root/types/diary';
import { Support } from '@root/types/support';
import Link from 'next/link';
import FollowModal from './components/FollowModal';
import InquiryModal from './components/InquiryModal';

export default function MyPage() {
  const [user, setUser] = useState<User.Me | null>(null);
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [likedDiaries, setLikedDiaries] = useState<Diary.Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('myDiaries');
  // 모달 상태
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    isFollowers: true,
  });

  // 문의 내역 데이터
  const [inquiries, setInquiries] = useState<Support.ISummary[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);

  // 문의하기 모달 상태
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await UserService.getMe();
        setUser(userData);

        if (userData) {
          // 내 다이어리 로드
          const diaryResponse = await DiaryService.getMyDiaries(userData.userId, {
            size: 9,
          });
          setDiaries(diaryResponse.list || []);

          // 좋아요한 다이어리도 함께 로드
          try {
            const likedResponse = await DiaryService.getLikedDiaries();
            setLikedDiaries(likedResponse.list || []);
          } catch (likedError) {
            console.error('좋아요한 다이어리를 불러오는 중 오류 발생:', likedError);
          }
        }
      } catch (error) {
        console.error('사용자 데이터를 불러오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    const fetchTabData = async () => {
      if (activeTab === 'liked' && likedDiaries.length === 0) {
        setTabLoading(true);
        try {
          const response = await DiaryService.getLikedDiaries();
          setLikedDiaries(response.list || []);
        } catch (error) {
          console.error('좋아요한 다이어리를 불러오는 중 오류 발생:', error);
        } finally {
          setTabLoading(false);
        }
      } else if (activeTab === 'inquiries' && inquiries.length === 0) {
        setLoadingInquiries(true);
        try {
          const response = await SupportService.getSupports();
          setInquiries(response.list || []);
        } catch (error) {
          console.error('문의 내역을 불러오는 중 오류 발생:', error);
        } finally {
          setLoadingInquiries(false);
        }
      }
    };

    fetchTabData();
  }, [activeTab, likedDiaries.length, inquiries.length]);

  // 모달 닫기
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  // 팔로워 모달 열기
  const openFollowersModal = () => {
    setModalState({
      isOpen: true,
      title: '팔로워',
      isFollowers: true,
    });
  };

  // 팔로잉 모달 열기
  const openFollowingsModal = () => {
    setModalState({
      isOpen: true,
      title: '팔로잉',
      isFollowers: false,
    });
  };

  // 언팔로우 처리
  const handleUnfollow = async (nickname: string) => {
    try {
      await FollowService.unfollow(nickname);
      // 카운트 업데이트
      if (user) {
        setUser({
          ...user,
          followings: Math.max(0, user.followings - 1),
        });
      }
    } catch (error) {
      console.error('언팔로우 실패:', error);
      throw error;
    }
  };

  // 문의 등록 성공 시 실행할 함수
  const handleInquirySuccess = async () => {
    // 문의 목록 새로고침
    setLoadingInquiries(true);
    try {
      const response = await SupportService.getSupports();
      setInquiries(response.list || []);
    } catch (error) {
      console.error('문의 목록을 불러오는 데 실패했습니다:', error);
    } finally {
      setLoadingInquiries(false);
    }
  };

  // 다이어리 카드 컴포넌트
  const DiaryCard = ({ diary }: { diary: Diary.Summary }) => (
    <Link
      href={`/diaries/${diary.diaryId}`}
      scroll={false}
      className='block border rounded-lg overflow-hidden hover:shadow-lg transition group'
    >
      <div className='h-48 bg-gray-200 relative overflow-hidden'>
        {diary.thumbnailUrl ? (
          <img
            src={diary.thumbnailUrl}
            alt='다이어리 이미지'
            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
          />
        ) : (
          <img
            src='/diary-thumbnail-test.png'
            alt='기본 다이어리 이미지'
            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
          />
        )}
        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300'></div>
      </div>
      <div className='p-4'>
        <h3 className='font-semibold mb-1 truncate'>{diary.title}</h3>
        <div className='flex text-sm text-gray-600 justify-between'>
          <span>{Diary.WeatherMap[diary.weatherInfo]}</span>
          <span>{new Date(diary.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );

  // 빈 다이어리 카드 컴포넌트
  const EmptyDiaryCard = () => (
    <div className='border border-dashed rounded-lg h-48 flex items-center justify-center'>
      <div className='text-center p-6'>
        <div className='text-4xl mb-2 text-gray-300'>+</div>
        <p className='text-gray-400'>새 다이어리 작성하기</p>
      </div>
    </div>
  );

  // 문의 내역 아이템 컴포넌트
  const InquiryItem = ({ inquiry }: { inquiry: Support.ISummary }) => (
    <div className='border rounded-lg overflow-hidden mb-4 hover:shadow-md transition'>
      <div className='px-4 py-3 bg-gray-50 flex justify-between items-center'>
        <div className='flex items-center'>
          <span
            className={`inline-block w-2 h-2 rounded-full mr-2 ${
              inquiry.answered ? 'bg-green-500' : 'bg-yellow-500'
            }`}
          ></span>
          <h3 className='font-medium'>{inquiry.title}</h3>
        </div>
        <span className='text-sm text-gray-500'>
          {new Date(inquiry.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-full overflow-y-auto border-x border-gray-200'>
      {/* 프로필 헤더 */}
      <div className='relative'>
        <div className='h-48 bg-gradient-to-r from-blue-400 to-indigo-500'></div>
        <div className='absolute bottom-0 left-0 w-full transform translate-y-1/2 px-8 flex items-end'>
          <div className='w-32 h-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg'>
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt='프로필 이미지'
                className='w-full h-full object-cover'
              />
            ) : (
              <img
                src='/test-profile.png'
                alt='기본 프로필 이미지'
                className='w-full h-full object-cover'
              />
            )}
          </div>
          <div className='ml-6 pb-4'>
            <h1 className='text-3xl font-bold'>{user?.name || 'User'}</h1>
            <p className='text-gray-700'>@{user?.nickname || 'username'}</p>
          </div>
          <button className='ml-auto mb-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition'>
            프로필 편집
          </button>
        </div>
      </div>

      {/* 통계 정보 */}
      <div className='mt-20 px-8 pt-4 pb-8 border-b'>
        <div className='flex space-x-12'>
          <div className='text-center'>
            <div className='text-2xl font-semibold'>{user?.diaryCount || 0}</div>
            <div className='text-gray-600'>다이어리</div>
          </div>
          <div
            className='text-center cursor-pointer hover:text-blue-500 transition'
            onClick={openFollowersModal}
          >
            <div className='text-2xl font-semibold'>{user?.followers || 0}</div>
            <div className='text-gray-600'>팔로워</div>
          </div>
          <div
            className='text-center cursor-pointer hover:text-blue-500 transition'
            onClick={openFollowingsModal}
          >
            <div className='text-2xl font-semibold'>{user?.followings || 0}</div>
            <div className='text-gray-600'>팔로잉</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-semibold'>{likedDiaries.length || 0}</div>
            <div className='text-gray-600'>좋아요</div>
          </div>
        </div>
      </div>

      {/* 탭 메뉴 */}
      <div className='px-8 border-b'>
        <div className='flex'>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'myDiaries'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('myDiaries')}
          >
            나의 다이어리
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'liked' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('liked')}
          >
            좋아요한 다이어리
          </button>
          <button
            className={`py-4 px-6 font-medium ${
              activeTab === 'inquiries'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('inquiries')}
          >
            내 문의 내역
          </button>
        </div>
      </div>

      {/* 다이어리 그리드 및 문의 내역 */}
      <div className='p-8'>
        {/* 탭 로딩 인디케이터 */}
        {tabLoading && (
          <div className='flex justify-center items-center py-10'>
            <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
          </div>
        )}

        {/* 내 다이어리 탭 */}
        {!tabLoading && activeTab === 'myDiaries' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <Link
              href='/diaries/create'
              className='border border-dashed rounded-lg overflow-hidden hover:shadow-md transition'
            >
              <EmptyDiaryCard />
            </Link>
            {diaries.length > 0 ? (
              diaries.map(diary => <DiaryCard key={diary.diaryId} diary={diary} />)
            ) : (
              <div className='col-span-3 py-10 text-center text-gray-500'>
                작성한 다이어리가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 좋아요한 다이어리 탭 */}
        {!tabLoading && activeTab === 'liked' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {likedDiaries.length > 0 ? (
              likedDiaries.map(diary => <DiaryCard key={diary.diaryId} diary={diary} />)
            ) : (
              <div className='col-span-3 py-10 text-center text-gray-500'>
                좋아요한 다이어리가 없습니다.
              </div>
            )}
          </div>
        )}

        {/* 내 문의 내역 탭 */}
        {!tabLoading && activeTab === 'inquiries' && (
          <div>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold'>내 문의 내역</h2>
              <button
                onClick={() => setInquiryModalOpen(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center'
              >
                <svg className='w-4 h-4 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='M12 4v16m8-8H4'
                  />
                </svg>
                문의하기
              </button>
            </div>

            {loadingInquiries ? (
              <div className='flex justify-center items-center py-10'>
                <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500'></div>
              </div>
            ) : inquiries.length > 0 ? (
              <div>
                {inquiries.map(inquiry => (
                  <InquiryItem key={inquiry.id} inquiry={inquiry} />
                ))}
              </div>
            ) : (
              <div className='py-10 text-center text-gray-500'>
                문의 내역이 없습니다. 궁금한 점이 있으시면 문의하기 버튼을 눌러주세요.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 추가 섹션: 최근 활동 */}
      <div className='px-8 py-6 border-t mt-auto'>
        <h2 className='text-xl font-semibold mb-4'>최근 활동</h2>
        <div className='space-y-4'>
          {diaries.length > 0 ? (
            diaries.slice(0, 3).map((diary, index) => (
              <div key={`activity-${index}`} className='flex items-center'>
                <div className='w-2 h-2 rounded-full bg-green-500 mr-3'></div>
                <span className='text-gray-600 text-sm'>
                  {new Date(diary.createdAt).toLocaleString()}에 새 다이어리를 작성했습니다.
                </span>
              </div>
            ))
          ) : (
            <div className='text-gray-500 text-sm'>최근 활동이 없습니다.</div>
          )}
        </div>
      </div>

      {/* 팔로워/팔로잉 모달 */}
      <FollowModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        isFollowers={modalState.isFollowers}
        onUnfollow={handleUnfollow}
      />

      {/* 문의하기 모달 */}
      <InquiryModal
        isOpen={inquiryModalOpen}
        onClose={() => setInquiryModalOpen(false)}
        onSuccess={handleInquirySuccess}
      />
    </div>
  );
}
