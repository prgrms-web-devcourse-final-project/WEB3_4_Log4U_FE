'use client';

import GoogleMapComponent from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { FollowService } from '@root/services/follow';
import { MapService } from '@root/services/map';
import { UserService } from '@root/services/user';
import { Diary } from '@root/types/diary';
import { Map } from '@root/types/map';
import { User } from '@root/types/user';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FollowModal from '@/app/mypage/components/FollowModal';

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

// 빈 다이어리 카드 컴포넌트
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
  const [followLoading, setFollowLoading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // 팔로우 모달 상태
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    isFollowers: true,
  });

  // 지도 관련 상태 추가
  const [zoomLevel, setZoomLevel] = useState(11); // 기본 줌 레벨
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [clusterData, setClusterData] = useState<Map.ISummary[]>([]);
  const [mapDiaries, setMapDiaries] = useState<Map.IDiary.IDetail[]>([]);
  const [mapLoading, setMapLoading] = useState(false);

  // IntersectionObserver를 위한 ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastDiaryRef = useRef<HTMLDivElement | null>(null);

  // 모달 관련 함수
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
    if (!profile || followLoading) return;

    setFollowLoading(true);
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
    } finally {
      setFollowLoading(false);
      setIsHovering(false);
    }
  };

  // 언팔로우 처리
  const handleUnfollow = async (nickname: string) => {
    try {
      await FollowService.unfollow(nickname);
      // 카운트 업데이트
      if (profile) {
        setProfile({
          ...profile,
          followings: Math.max(0, profile.followings - 1),
        });
      }
    } catch (error) {
      console.error('언팔로우 실패:', error);
      throw error;
    }
  };

  // 줌 레벨 변경 처리 함수
  const handleZoomChanged = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
  }, []);

  // 맵 경계 변경 처리 함수
  const handleBoundsChanged = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      setMapBounds(bounds);
    },
    []
  );

  // 맵 데이터 로드 함수 - 디바운싱 적용
  const loadMapData = useCallback(async () => {
    if (!mapBounds || mapLoading || !profile) return;

    setMapLoading(true);
    try {
      const query: Map.GetListQueryDto = {
        north: mapBounds.north,
        south: mapBounds.south,
        east: mapBounds.east,
        west: mapBounds.west,
        zoom: zoomLevel,
      };

      if (zoomLevel <= 13) {
        // 줌 레벨이 13 이하일 경우 클러스터 데이터 로드 (유저의 클러스터)
        const clusters = await MapService.getMapCluster(query);
        setClusterData(clusters);
        setMapDiaries([]);
      } else {
        // 줌 레벨이 14 이상일 경우 다이어리 데이터 로드 (유저의 다이어리)
        const diaries = await MapService.getMapDiaries(query);
        setMapDiaries(diaries);
        setClusterData([]);
      }
    } catch (error) {
      console.error('맵 데이터 로드 중 오류 발생:', error);
    } finally {
      setMapLoading(false);
    }
  }, [mapBounds, zoomLevel, mapLoading, profile]);

  // 맵 데이터 로드를 위한 디바운싱 타이머 참조
  const mapDataTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 맵 경계 또는 줌 레벨 변경 시 데이터 로드 (디바운싱 적용)
  useEffect(() => {
    // 이전 타이머가 있으면 취소
    if (mapDataTimerRef.current) {
      clearTimeout(mapDataTimerRef.current);
    }

    // mapBounds가 null이면 아직 맵이 준비되지 않은 상태
    if (!mapBounds || !profile) return;

    // 500ms 후에 데이터 로드 (디바운싱)
    mapDataTimerRef.current = setTimeout(() => {
      loadMapData();
    }, 500);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (mapDataTimerRef.current) {
        clearTimeout(mapDataTimerRef.current);
      }
    };
  }, [mapBounds, zoomLevel, profile, loadMapData]);

  // 맵에 표시할 마커 데이터 생성
  const mapMarkers = useMemo(() => {
    if (zoomLevel <= 13) {
      // 클러스터 데이터 마커
      return clusterData.map(cluster => ({
        id: cluster.areaId,
        lat: cluster.lat,
        lng: cluster.lon,
        profileUrl: '/hot-logger.png', // 클러스터 아이콘
        count: cluster.diaryCount,
        title: `${cluster.areaName} (${cluster.diaryCount}개)`,
      }));
    } else {
      // 다이어리 마커
      return mapDiaries.map(diary => ({
        id: diary.diaryId,
        lat: diary.latitude,
        lng: diary.longitude,
        profileUrl: diary.thumbnailUrl || '/diary-thumbnail-test.png',
        title: diary.title,
      }));
    }
  }, [zoomLevel, clusterData, mapDiaries]);

  // 초기 데이터 로드
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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
        if (entry.isIntersecting && !loading) {
          // 추가 다이어리 로드 로직 (필요시 구현)
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
  }, [loading]);

  if (loading) {
    return (
      <div className='flex p-4'>
        <div className='flex-1 flex flex-col overflow-hidden'>
          <div className='p-6 border-b animate-pulse'>
            <div className='flex items-center'>
              <div className='w-20 h-20 rounded-full bg-gray-200 mr-6'></div>
              <div className='space-y-2'>
                <div className='h-6 bg-gray-200 rounded w-40'></div>
                <div className='h-4 bg-gray-200 rounded w-60'></div>
              </div>
            </div>
          </div>
          <div className='px-6 py-4 border-b'>
            <div className='h-6 bg-gray-200 rounded w-48 mb-2'></div>
            <div className='h-4 bg-gray-200 rounded w-full'></div>
          </div>
          <div className='flex-1 bg-gray-100'></div>
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
    <div className='flex p-4'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* 사용자 프로필 정보 */}
        <div className='p-6 border-b'>
          <div className='flex items-center'>
            <div className='w-20 h-20 rounded-full border overflow-hidden mr-6'>
              <img
                src={profile?.profileImage ?? '/public/test-profile.svg'}
                alt='프로필 이미지'
                className='w-full h-full object-cover'
              />
            </div>

            <div className='flex-1'>
              <div className='flex justify-between items-center mb-2'>
                <h1 className='text-xl font-bold'>{profile.nickname}</h1>
                {!isMyself && (
                  <button
                    onClick={handleToggleFollow}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    disabled={followLoading}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition relative ${
                      isFollowing
                        ? isHovering
                          ? 'bg-red-100 text-red-600 border border-red-600'
                          : 'bg-gray-200 text-gray-800 border border-gray-300'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {followLoading ? (
                      <span className='flex items-center justify-center'>
                        <span className='animate-spin h-4 w-4 border-2 border-t-transparent rounded-full mr-1'></span>
                        처리 중
                      </span>
                    ) : isFollowing ? (
                      isHovering ? (
                        '언팔로우'
                      ) : (
                        '팔로잉'
                      )
                    ) : (
                      '팔로우'
                    )}
                  </button>
                )}
              </div>
              <div className='flex space-x-4 text-sm'>
                <div>
                  <span className='font-semibold'>{profile.diaryCount}</span> 게시물
                </div>
                <div
                  className='cursor-pointer hover:text-blue-500 transition'
                  onClick={openFollowersModal}
                >
                  <span className='font-semibold'>{profile.followers}</span> 팔로워
                </div>
                <div
                  className='cursor-pointer hover:text-blue-500 transition'
                  onClick={openFollowingsModal}
                >
                  <span className='font-semibold'>{profile.followings}</span> 팔로잉
                </div>
              </div>
              {profile.statusMessage && (
                <p className='text-gray-700 mt-2'>{profile.statusMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* 다이어리 지도 제목 */}
        <div className='px-6 py-4 border-b'>
          <h2 className='text-xl font-bold'>다이어리 지도 - 경로 시각화</h2>
          <p className='text-sm text-gray-500 mt-1'>
            {zoomLevel <= 13
              ? '지역별 다이어리 클러스터를 표시합니다. 확대하여 개별 다이어리를 확인하세요.'
              : '개별 다이어리 위치를 표시합니다.'}
          </p>
        </div>

        {/* 구글 맵 */}
        <GoogleMapComponent
          markers={mapMarkers}
          onZoomChanged={handleZoomChanged}
          onBoundsChanged={handleBoundsChanged}
          initialZoom={zoomLevel}
        />

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

            {/* 더 이상 불러올 데이터가 없을 때 */}
            {diaries.length === 0 && (
              <div className='text-center py-4 text-gray-500'>작성한 다이어리가 없습니다.</div>
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
