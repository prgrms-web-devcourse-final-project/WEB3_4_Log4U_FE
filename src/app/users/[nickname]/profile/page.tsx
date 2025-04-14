'use client';

import { DiaryService } from '@root/services/diary';
import { UserService } from '@root/services/user';
import { Diary } from '@root/types/diary';
import { User } from '@root/types/user';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FollowService } from '@root/services/follow';

// 다이어리 카드 컴포넌트
const DiaryCard = ({ diary }: { diary: Diary.Summary }) => (
  <Link
    href={`/diaries/${diary.diaryId}`}
    key={diary.diaryId}
    className='block border rounded-lg overflow-hidden hover:shadow-md transition h-full'
  >
    <div className='h-52 bg-gray-200 relative'>
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
      {/* 좋아요 수 - 이미지 우측 하단에 오버레이 */}
      <div className='absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full px-2 py-1 flex items-center text-xs'>
        <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
          <path
            fillRule='evenodd'
            d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'
            clipRule='evenodd'
          />
        </svg>
        <span>{diary.likeCount || 0}</span>
      </div>
    </div>
    <div className='p-3 text-sm'>
      {/* 다이어리 제목 */}
      <h3 className='font-bold text-gray-800 truncate'>{diary.title || '제목 없음'}</h3>

      <div className='flex items-center justify-between mt-2 text-xs text-gray-600'>
        {/* 작성자 정보 */}
        <div className='flex items-center'>
          {diary.authorProfileImage && (
            <div className='w-4 h-4 rounded-full overflow-hidden mr-1 flex-shrink-0'>
              <img
                src={diary.authorProfileImage}
                alt={`${diary.authorNickname}의 프로필`}
                className='w-full h-full object-cover'
              />
            </div>
          )}
          <span className='truncate max-w-[120px]'>
            {diary.authorNickname || '작성자 정보 없음'}
          </span>
        </div>

        {/* 위치 정보 - 일반 다이어리 카드 */}
        <div
          className='truncate max-w-[120px]'
          title={`${diary.sido || ''} ${diary.sigungu || ''} ${diary.dongmyun || ''}`}
        >
          {diary.sigungu && diary.dongmyun
            ? `${diary.sigungu} ${diary.dongmyun}`
            : diary.dongmyun || diary.sigungu || '위치 정보 없음'}
        </div>
      </div>
    </div>
  </Link>
);

// 빈 다이어리 카드 컴포넌트 (로딩 상태 표시용)
const EmptyDiaryCard = ({ index }: { index: number }) => (
  <div
    key={`empty-${index}`}
    className='block border rounded-lg overflow-hidden hover:shadow-md transition h-full'
  >
    <div className='h-52 bg-gray-100'></div>
    <div className='p-3 text-sm'>
      {/* 다이어리 제목 */}
      <h3 className='font-bold text-gray-300 truncate'>제목 없음</h3>

      <div className='flex items-center justify-between mt-2 text-xs text-gray-300'>
        {/* 작성자 정보 */}
        <div className='flex items-center'>
          <span className='truncate max-w-[120px]'>작성자 정보 없음</span>
        </div>

        {/* 위치 정보 - 빈 다이어리 카드 */}
        <div className='truncate max-w-[120px]'>위치 정보 없음</div>
      </div>
    </div>
  </div>
);

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const nickname = params.nickname as string;

  const [profile, setProfile] = useState<User.IDetail | null>(null);
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMyself, setIsMyself] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  // 유저 정보 및 다이어리 불러오기
  const loadUserData = useCallback(async () => {
    if (!nickname) return;

    setLoading(true);
    try {
      // 현재 로그인한 사용자 정보 가져오기
      const meData = await UserService.getMe();

      // 프로필 사용자 정보 가져오기
      const userData = await UserService.getUser(nickname);
      setProfile(userData);

      // 자신의 프로필인지 확인
      setIsMyself(meData.userId === userData.userId);

      // 다이어리 목록 가져오기
      const diariesData = await DiaryService.getUserDiaries(userData.userId);
      setDiaries(diariesData.list || []);

      // 팔로우 여부 확인 (자신이 아닐 경우)
      if (meData.userId !== userData.userId) {
        try {
          const followingsData = await FollowService.getFollowings();
          // list 속성을 통해 followings 배열에 접근
          const isFollowingUser = followingsData.list.some(
            (following: User.IFollowSummary) => following.userId === userData.userId
          );
          setIsFollowing(isFollowingUser);
        } catch (error) {
          console.error('팔로우 정보 확인 중 오류:', error);
        }
      }
    } catch (error) {
      console.error('유저 프로필 데이터 로딩 중 오류 발생:', error);
      // 404 또는 기타 오류 발생시 홈으로 리다이렉트
      router.push('/');
    } finally {
      setLoading(false);
    }
  }, [nickname, router]);

  // 팔로우/언팔로우 처리
  const handleToggleFollow = async () => {
    if (!profile) return;

    try {
      if (isFollowing) {
        await FollowService.unfollow(profile.nickname);
        setIsFollowing(false);
        // 팔로워 수 업데이트
        setProfile(prev => (prev ? { ...prev, followers: Math.max(0, prev.followers - 1) } : null));
      } else {
        await FollowService.follow(profile.nickname);
        setIsFollowing(true);
        // 팔로워 수 업데이트
        setProfile(prev => (prev ? { ...prev, followers: prev.followers + 1 } : null));
      }
    } catch (error) {
      console.error('팔로우 상태 변경 중 오류:', error);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (loading) {
    return (
      <div className='flex flex-col items-center p-4 max-w-5xl mx-auto'>
        <div className='w-full bg-gray-100 animate-pulse rounded-lg h-40 mb-6'></div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
          {[...Array(6)].map((_, index) => (
            <EmptyDiaryCard key={index} index={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='flex flex-col items-center justify-center p-4 h-[60vh]'>
        <h2 className='text-2xl font-bold mb-4'>사용자를 찾을 수 없습니다</h2>
        <p className='text-gray-600 mb-6'>요청하신 프로필을 찾을 수 없습니다.</p>
        <button
          onClick={() => router.push('/')}
          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition'
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center p-4 max-w-5xl mx-auto'>
      {/* 프로필 카드 */}
      <div className='w-full bg-white rounded-lg shadow-sm p-6 mb-8'>
        <div className='flex flex-col md:flex-row items-center md:items-start gap-6'>
          {/* 프로필 이미지 */}
          <div className='w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0'>
            <img
              src={profile.profileImage || '/default-profile.png'}
              alt={`${profile.nickname}의 프로필`}
              className='w-full h-full object-cover'
            />
          </div>

          {/* 프로필 정보 */}
          <div className='flex-1'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4'>
              <h1 className='text-2xl font-bold mb-2 md:mb-0'>{profile.nickname}</h1>

              {/* 팔로우 버튼 (자신의 프로필이 아닐 경우만 표시) */}
              {!isMyself && (
                <button
                  onClick={handleToggleFollow}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                    isFollowing
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? '팔로잉' : '팔로우'}
                </button>
              )}
            </div>

            {/* 통계 */}
            <div className='flex space-x-6 mb-4'>
              <div className='text-center'>
                <div className='font-semibold'>{profile.diaryCount}</div>
                <div className='text-sm text-gray-500'>게시물</div>
              </div>
              <div className='text-center'>
                <div className='font-semibold'>{profile.followers}</div>
                <div className='text-sm text-gray-500'>팔로워</div>
              </div>
              <div className='text-center'>
                <div className='font-semibold'>{profile.followings}</div>
                <div className='text-sm text-gray-500'>팔로잉</div>
              </div>
            </div>

            {/* 상태 메시지 */}
            <p className='text-gray-700'>{profile.statusMessage || '상태 메시지가 없습니다.'}</p>
          </div>
        </div>
      </div>

      {/* 다이어리 목록 */}
      <div className='w-full'>
        <h2 className='text-xl font-bold mb-4'>다이어리</h2>

        {diaries.length === 0 ? (
          <div className='text-center py-10 text-gray-500'>작성한 다이어리가 없습니다.</div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {diaries.map(diary => (
              <DiaryCard key={diary.diaryId} diary={diary} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
