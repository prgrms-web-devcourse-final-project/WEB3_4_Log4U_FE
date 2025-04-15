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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FollowModal from './mypage/components/FollowModal';

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
    if (!mapBounds || mapLoading) return;

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
        // 줌 레벨이 13 이하일 경우 클러스터 데이터 로드
        const clusters = await MapService.getMyMapCluster(query);
        setClusterData(clusters);
        setMapDiaries([]);
      } else {
        // 줌 레벨이 14 이상일 경우 다이어리 데이터 로드
        const diaries = await MapService.getMyMapDiaries(query);
        setMapDiaries(diaries);
        setClusterData([]);
      }
    } catch (error) {
      console.error('맵 데이터 로드 중 오류 발생:', error);
    } finally {
      setMapLoading(false);
    }
  }, [mapBounds, zoomLevel, mapLoading]);

  // 맵 데이터 로드를 위한 디바운싱 타이머 참조
  const mapDataTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 이전 맵 상태를 저장하기 위한 참조
  const prevMapStateRef = useRef<{
    bounds: { north: number; south: number; east: number; west: number } | null;
    zoom: number;
  }>({ bounds: null, zoom: zoomLevel });

  // 맵 경계 또는 줌 레벨 변경 시 데이터 로드 (디바운싱 적용)
  useEffect(() => {
    // mapBounds가 null이면 아직 맵이 준비되지 않은 상태
    if (!mapBounds) return;

    // 상태 변화가 없으면 API 호출하지 않음
    const prevState = prevMapStateRef.current;
    const boundsChanged =
      !prevState.bounds ||
      Math.abs(prevState.bounds.north - mapBounds.north) > 0.0001 ||
      Math.abs(prevState.bounds.south - mapBounds.south) > 0.0001 ||
      Math.abs(prevState.bounds.east - mapBounds.east) > 0.0001 ||
      Math.abs(prevState.bounds.west - mapBounds.west) > 0.0001;

    const zoomChanged = prevState.zoom !== zoomLevel;

    // 맵 상태에 변화가 없으면 호출 건너뛰기
    if (!boundsChanged && !zoomChanged) return;

    // 현재 상태 저장
    prevMapStateRef.current = {
      bounds: { ...mapBounds },
      zoom: zoomLevel,
    };

    // 이전 타이머가 있으면 취소
    if (mapDataTimerRef.current) {
      clearTimeout(mapDataTimerRef.current);
    }

    // 디바운싱 적용 - 800ms 동안 추가 변경이 없을 때만 API 호출
    mapDataTimerRef.current = setTimeout(() => {
      console.log('맵 데이터 로드: 디바운싱 후 API 호출');
      loadMapData();
    }, 800);

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (mapDataTimerRef.current) {
        clearTimeout(mapDataTimerRef.current);
      }
    };
  }, [mapBounds, zoomLevel, loadMapData]);

  // 맵에 표시할 마커 데이터 생성
  const mapMarkers = useMemo(() => {
    // 유효한 위도/경도 값인지 확인하는 헬퍼 함수
    const isValidCoordinate = (value: unknown): boolean => {
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    };

    if (zoomLevel <= 13) {
      // 클러스터 데이터 마커
      return clusterData
        .filter(cluster => isValidCoordinate(cluster.lat) && isValidCoordinate(cluster.lon))
        .map(cluster => ({
          id: `cluster_${cluster.areaId}`, // 고유한 ID 생성: 'cluster_' 접두사 추가
          lat: Number(cluster.lat), // 명시적으로 숫자로 변환
          lng: Number(cluster.lon), // 명시적으로 숫자로 변환
          profileUrl: '/hot-logger.png', // 클러스터 아이콘
          count: cluster.diaryCount,
          title: `${cluster.areaName || '지역'} (${cluster.diaryCount}개)`,
        }));
    } else {
      // 다이어리 마커
      return mapDiaries
        .filter(diary => isValidCoordinate(diary.latitude) && isValidCoordinate(diary.longitude))
        .map(diary => {
          console.log(diary);
          console.log(diary.latitude);
          console.log(diary.longitude);
          return {
            id: `diary_${diary.diaryId}`, // 고유한 ID 생성: 'diary_' 접두사 추가
            lat: Number(diary.latitude), // 명시적으로 숫자로 변환
            lng: Number(diary.longitude), // 명시적으로 숫자로 변환
            profileUrl: diary.thumbnailUrl || '/diary-thumbnail-test.png',
            title: diary.title || '제목 없음',
          };
        });
    }
  }, [zoomLevel, clusterData, mapDiaries]);

  return (
    <div className='flex p-4'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* 사용자 프로필 정보 */}
        <div className='p-6 border-b'>
          <div className='flex items-center'>
            <div className='w-20 h-20 rounded-full border overflow-hidden mr-6'>
              <img
                src={user?.profileImage ?? '/test-profile.'}
                alt='프로필 이미지'
                className='w-full h-full object-cover'
              />
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
          <p className='text-sm text-gray-500 mt-1'>
            {zoomLevel <= 13
              ? '지역별 다이어리 클러스터를 표시합니다. 확대하여 개별 다이어리를 확인하세요.'
              : '개별 다이어리 위치를 표시합니다.'}
          </p>
        </div>

        {/* 구글 맵 */}
        <GoogleMapComponent
          markers={mapMarkers.filter(marker => marker.lat && marker.lng)}
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
