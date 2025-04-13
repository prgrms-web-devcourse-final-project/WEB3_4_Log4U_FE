'use client';

import { useEffect, useState } from 'react';
import { UserService } from '@root/services/user';
import { DiaryService } from '@root/services/diary';
import { User } from '@root/types/user';
import { Diary } from '@root/types/diary';
import Link from 'next/link';

export default function MyPage() {
  const [user, setUser] = useState<User.Me | null>(null);
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('myDiaries');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await UserService.getMe();
        setUser(userData);

        if (userData) {
          const diaryResponse = await DiaryService.getMyDiaries(userData.userId, {
            size: 9,
          });
          setDiaries(diaryResponse.list || []);
        }
      } catch (error) {
        console.error('사용자 데이터를 불러오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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
          <div className='text-center'>
            <div className='text-2xl font-semibold'>{user?.followers || 0}</div>
            <div className='text-gray-600'>팔로워</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-semibold'>{user?.followings || 0}</div>
            <div className='text-gray-600'>팔로잉</div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-semibold'>{0}</div>
            <div className='text-gray-600'>댓글</div>
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
              activeTab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            저장한 다이어리
          </button>
        </div>
      </div>

      {/* 다이어리 그리드 */}
      <div className='p-8'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {activeTab === 'myDiaries' && (
            <>
              <Link
                href='/diaries/create'
                className='border border-dashed rounded-lg overflow-hidden hover:shadow-md transition'
              >
                <EmptyDiaryCard />
              </Link>
              {diaries.map(diary => (
                <DiaryCard key={diary.diaryId} diary={diary} />
              ))}
            </>
          )}

          {activeTab === 'liked' && (
            <div className='col-span-3 py-16 text-center text-gray-500'>
              아직 좋아요한 다이어리가 없습니다.
            </div>
          )}

          {activeTab === 'saved' && (
            <div className='col-span-3 py-16 text-center text-gray-500'>
              아직 저장한 다이어리가 없습니다.
            </div>
          )}
        </div>
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
    </div>
  );
}
