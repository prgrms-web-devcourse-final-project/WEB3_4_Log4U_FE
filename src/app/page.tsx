'use client';

import GoogleMapComponent from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { UserService } from '@root/services/user';
import { FollowService } from '@root/services/follow';
import { Diary } from '@root/types/diary';
import { User } from '@root/types/user';
import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import FollowModal from './mypage/components/FollowModal';

// 다이어리 카드 컴포넌트
const DiaryCard = ({ diary }: { diary: Diary.Summary }) => (
  <Link
    href={`/diaries/${diary.diaryId}`}
    key={diary.diaryId}
    className='block border rounded-lg overflow-hidden hover:shadow-md transition'
  >
    <div className='h-40 bg-gray-200 relative'>
      {diary.thumbnailUrl ? (
        <img
          src={diary.thumbnailUrl}
          alt='다이어리 이미지'
          className='w-full h-full object-cover'
        />
      ) : (
        <img
          src='/diary-thumbnail-test.png'
          alt='기본 다이어리 이미지'
          className='w-full h-full object-cover'
        />
      )}
    </div>
    <div className='p-3 text-sm text-center text-gray-700'>
      <div>다이어리 여행,</div>
      <div>
        {diary.dongmyun}, {Diary.WeatherMap[diary.weatherInfo]}
      </div>
    </div>
  </Link>
);

// 빈 다이어리 카드 컴포넌트
const EmptyDiaryCard = ({ index }: { index: number }) => (
  <div
    key={`empty-${index}`}
    className='border rounded overflow-hidden aspect-square flex flex-col h-[250px]'
  >
    <div className='w-full flex-1 bg-gray-100'></div>
    <div className='p-2 text-center text-sm text-gray-300 h-16 flex flex-col justify-center'>
      <p>다이어리 없음</p>
    </div>
  </div>
);

export default function HomePage() {
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [user, setUser] = useState<User.Me | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);

  // 팔로우 모달 상태
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    isFollowers: true,
  });

  // IntersectionObserver를 위한 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastDiaryRef = useRef<HTMLDivElement | null>(null);

  // 초기 데이터 로드
  const loadDiaries = useCallback(
    async (cursorId: number | null = null) => {
      if (loading || (!hasMore && cursorId !== null)) return;

      setLoading(true);

      try {
        // 사용자 정보 로드
        if (!user) {
          const userData = await UserService.getMe();
          setUser(userData);

          // 사용자 정보를 받은 후에 다이어리 로드 (커서 기반)
          const response = await DiaryService.getMyDiaries(userData.userId, {
            cursorId: cursorId || undefined,
            size: 9,
          });

          const newDiaries = response.list || [];
          const pageInfo = response.pageInfo;

          setDiaries(newDiaries);
          setHasMore(pageInfo.hasNext);
          setNextCursor(pageInfo.nextCursor || null);
        } else {
          // 이미 사용자 정보가 있는 경우 다이어리만 로드 (커서 기반)
          const response = await DiaryService.getMyDiaries(user.userId, {
            cursorId: cursorId || undefined,
            size: 9,
          });

          const newDiaries = response.list || [];
          const pageInfo = response.pageInfo;

          // 첫 로드인 경우 대체, 아닌 경우 추가
          setDiaries(prev => (cursorId ? [...prev, ...newDiaries] : newDiaries));

          // 다음 페이지 여부와 커서 설정
          setHasMore(pageInfo.hasNext);
          setNextCursor(pageInfo.nextCursor || null);
        }
      } catch (error) {
        console.error('다이어리 로딩 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    },
    [loading, hasMore, user]
  );

  // 초기 로드
  useEffect(() => {
    loadDiaries(null);
  }, []);

  // IntersectionObserver 설정
  useEffect(() => {
    // 이전 옵저버 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 새 옵저버 생성
    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && nextCursor) {
          loadDiaries(nextCursor);
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    // 마지막 요소 관찰 시작
    if (lastDiaryRef.current) {
      observerRef.current.observe(lastDiaryRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadDiaries, hasMore, loading, nextCursor]);

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

  return (
    <div className='flex p-4'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* 사용자 프로필 정보 */}
        <div className='p-6 border-b'>
          <div className='flex items-center'>
            <div className='w-20 h-20 rounded-full border overflow-hidden mr-6'>
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

            <div>
              <h1 className='text-xl font-bold mb-2'>{user?.name || 'winter'}</h1>
              <div className='flex space-x-4 text-sm'>
                <div>게시물 {user?.diaryCount || 0}</div>
                <div
                  className='cursor-pointer hover:text-blue-500 transition'
                  onClick={openFollowersModal}
                >
                  팔로워 {user?.followers || 0}
                </div>
                <div
                  className='cursor-pointer hover:text-blue-500 transition'
                  onClick={openFollowingsModal}
                >
                  팔로잉 {user?.followings || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 다이어리 지도 제목 */}
        <div className='px-6 py-4 border-b'>
          <h2 className='text-xl font-bold'>다이어리 지도 - 경로 시각화</h2>
        </div>

        {/* 구글 맵 */}
        <GoogleMapComponent
          markers={
            diaries.map(diary => ({
              id: diary.diaryId,
              lat: diary.latitude,
              lng: diary.longitude,
              title: diary.title,
              profileUrl: diary.thumbnailUrl,
            })) ?? []
          }
        ></GoogleMapComponent>

        {/* 공개된 다이어리 섹션 - 스크롤 가능한 별도 박스 */}
        <div className='px-6 py-4'>
          <h3 className='text-lg font-bold mb-4'>공개된 다이어리</h3>

          {/* 다이어리 그리드 - 스크롤 가능한 별도 박스 */}
          <div className='overflow-y-auto max-h-[600px] pr-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
            <div className='grid grid-cols-3 gap-4'>
              {diaries.length > 0
                ? diaries.map((diary, index) => (
                    <div
                      key={diary.diaryId}
                      ref={index === diaries.length - 1 ? lastDiaryRef : null}
                    >
                      <DiaryCard diary={diary} />
                    </div>
                  ))
                : // 다이어리가 없을 경우 빈 그리드 셀 9개 생성
                  Array.from({ length: 9 }).map((_, index) => (
                    <EmptyDiaryCard key={index} index={index} />
                  ))}
            </div>

            {/* 로딩 인디케이터 */}
            {loading && (
              <div className='flex justify-center items-center py-4'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800'></div>
              </div>
            )}

            {/* 더 이상 불러올 데이터가 없을 때 */}
            {!hasMore && diaries.length > 0 && (
              <div className='text-center py-4 text-gray-500'>모든 다이어리를 불러왔습니다.</div>
            )}
          </div>
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
    </div>
  );
}
