'use client';

import GoogleMapComponent, { MapMarker } from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { FollowService } from '@root/services/follow';
import { MapService } from '@root/services/map';
import { UserService } from '@root/services/user';
import { Diary } from '@root/types/diary';
import { Map } from '@root/types/map';
import { User } from '@root/types/user';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
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
          title={
            diary.location
              ? `${diary.location.sido || ''} ${diary.location.sigungu || ''} ${diary.location.eupmyeondong || ''}`
              : '위치 정보 없음'
          }
        >
          {diary.location
            ? diary.location.sigungu && diary.location.eupmyeondong
              ? `${diary.location.sigungu} ${diary.location.eupmyeondong}`
              : diary.location.eupmyeondong || diary.location.sigungu || '위치 정보 없음'
            : '위치 정보 없음'}
        </div>
      </div>
    </div>
  </Link>
);

// 빈 상태 컴포넌트
const EmptyState = () => (
  <div className='col-span-3 flex flex-col items-center justify-center py-12 px-4'>
    <div className='bg-[#f5f0e6] rounded-full w-32 h-32 flex items-center justify-center mb-6'>
      <svg
        className='w-16 h-16 text-[#6c584c]'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        stroke='currentColor'
      >
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
        />
      </svg>
    </div>
    <h3 className='text-xl font-bold text-[#3c3c3c] mb-2'>아직 작성된 다이어리가 없어요</h3>
    <p className='text-[#6c584c] text-center max-w-md mb-6'>
      첫 번째 다이어리를 작성하고 특별한 순간을 기록해보세요. 위치 정보와 함께 당신의 추억을 지도에
      남겨보세요.
    </p>
    <Link
      href='/diaries/new'
      className='px-6 py-3 bg-gradient-to-r from-[#6c584c] to-[#a4161a] text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg'
    >
      <div className='flex items-center'>
        <svg className='w-5 h-5 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
        </svg>
        새 다이어리 작성하기
      </div>
    </Link>
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

  // API 상태와 결과 저장
  const [mapLoading, setMapLoading] = useState(false);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  // 플래그로 API 호출 제어
  const [shouldLoadMapData, setShouldLoadMapData] = useState(false);

  // 참조 값들
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastDiaryRef = useRef<HTMLDivElement | null>(null);
  const mapDataTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastApiCallTimeRef = useRef<number>(0);
  const apiCallCountRef = useRef<number>(0);

  // 지도 확장 상태
  const [isMapExpanded, setIsMapExpanded] = useState(false);

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

  // 지도 확장 토글 핸들러
  const handleExpandMap = useCallback(() => {
    setIsMapExpanded(prev => !prev);
  }, []);

  // 줌 레벨 변경 처리 함수
  const handleZoomChanged = useCallback(
    (newZoom: number) => {
      // 정수로 변환하여 변경 감지
      const intZoom = Math.floor(newZoom);
      const currentIntZoom = Math.floor(zoomLevel);

      if (intZoom !== currentIntZoom) {
        console.log('줌 레벨 변경:', intZoom, '이전:', currentIntZoom);

        // 정수 값으로만 저장
        setZoomLevel(intZoom);

        // 줌 레벨 변경 시 바로 로드 트리거
        const thresholdCrossed =
          (currentIntZoom <= 13 && intZoom > 13) || (currentIntZoom > 13 && intZoom <= 13);

        if (thresholdCrossed && mapBounds) {
          // 클러스터 <-> 개별 마커 변경 시 즉시 로드
          setMapMarkers([]);
          setShouldLoadMapData(true);
        }
      }
    },
    [zoomLevel, mapBounds]
  );

  // 맵 경계 변경 처리 함수 - 더 엄격한 비교와 스로틀링 적용
  const handleBoundsChanged = useCallback(
    (bounds: { north: number; south: number; east: number; west: number }) => {
      // 로딩 중일 때는 바운드 업데이트 무시
      if (mapLoading) return;

      // 소수점 2자리까지만 사용 (정밀도 감소)
      const newBounds = {
        north: Math.round(bounds.north * 100) / 100,
        south: Math.round(bounds.south * 100) / 100,
        east: Math.round(bounds.east * 100) / 100,
        west: Math.round(bounds.west * 100) / 100,
      };

      // 이전 bounds와 똑같으면 무시
      if (
        mapBounds &&
        newBounds.north === Math.round(mapBounds.north * 100) / 100 &&
        newBounds.south === Math.round(mapBounds.south * 100) / 100 &&
        newBounds.east === Math.round(mapBounds.east * 100) / 100 &&
        newBounds.west === Math.round(mapBounds.west * 100) / 100
      ) {
        return;
      }

      // bounds 상태 업데이트
      setMapBounds(newBounds);

      // 데이터 로드 요청 플래그 설정
      setShouldLoadMapData(true);
    },
    [mapBounds, mapLoading]
  );

  // 맵 데이터 로드 함수
  const loadMapData = useCallback(async () => {
    // API 호출 시간 제한 (최소 2초 간격)
    const now = Date.now();
    if (now - lastApiCallTimeRef.current < 2000) {
      console.log('맵 데이터 로드 건너뜀: 이전 API 호출 후 2초 이내');
      return;
    }

    if (!mapBounds || mapLoading) {
      console.log('맵 로드 건너뜀: bounds 없음 또는 로딩 중', { mapBounds, mapLoading });
      return;
    }

    // API 호출 시간 기록
    lastApiCallTimeRef.current = now;
    // API 호출 카운트 증가
    apiCallCountRef.current += 1;

    console.log(`맵 데이터 로드 시작 (${apiCallCountRef.current}번째 호출)`, {
      bounds: mapBounds,
      zoom: zoomLevel,
    });

    setMapLoading(true);
    try {
      const query: Map.GetListQueryDto = {
        north: mapBounds.north,
        south: mapBounds.south,
        east: mapBounds.east,
        west: mapBounds.west,
        zoom: zoomLevel,
      };

      console.log('맵 API 요청 파라미터:', query);

      let markers: MapMarker[] = [];

      if (zoomLevel <= 13) {
        // 줌 레벨이 13 이하일 경우 클러스터 데이터 로드
        const clusters = await MapService.getMyMapCluster(query);
        console.log('클러스터 데이터 응답:', clusters);

        // 클러스터 마커 생성
        markers = clusters
          .filter(
            cluster =>
              typeof cluster.lat === 'number' &&
              typeof cluster.lon === 'number' &&
              !isNaN(cluster.lat) &&
              !isNaN(cluster.lon) &&
              cluster.diaryCount > 0
          )
          .map(cluster => ({
            id: cluster.areaId,
            lat: cluster.lat,
            lng: cluster.lon,
            profileUrl: '/hot-logger.png', // 클러스터 아이콘
            count: cluster.diaryCount,
            title: `${cluster.areaName} (${cluster.diaryCount}개)`,
          }));

        console.log(`클러스터 마커 생성: ${markers.length}개`);
      } else {
        // 줌 레벨이 14 이상일 경우 다이어리 데이터 로드
        console.log('다이어리 마커 API 요청 시작');
        const diaries = await MapService.getMyMapDiaries(query);
        console.log('다이어리 마커 API 응답:', diaries);

        // 데이터 유효성 검사
        if (!Array.isArray(diaries)) {
          console.error('API 응답이 배열이 아닙니다:', diaries);
        } else if (diaries.length === 0) {
          console.log('표시할 다이어리가 없습니다.');
        } else {
          // 다이어리 마커 생성
          markers = diaries
            .filter(
              diary =>
                typeof diary.lat === 'number' &&
                typeof diary.lon === 'number' &&
                !isNaN(diary.lat) &&
                !isNaN(diary.lon)
            )
            .map(diary => ({
              id: diary.diaryId,
              lat: diary.lat,
              lng: diary.lon,
              profileUrl: diary.thumbnailUrl || '/diary-thumbnail-test.png',
              title: diary.title || '제목 없음',
            }));

          console.log(`다이어리 마커 생성: ${markers.length}개/${diaries.length}`);
        }
      }

      // 유효한 마커만 설정
      if (markers.length > 0) {
        setMapMarkers(markers);
        console.log('최종 마커 배열:', markers);
      } else {
        console.warn('유효한 마커가 없습니다.');
        setMapMarkers([]);
      }
    } catch (error) {
      console.error('맵 데이터 로드 중 오류 발생:', error);
      setMapMarkers([]); // 오류 시 마커 초기화
    } finally {
      setMapLoading(false);
      // API 로드 상태 초기화
      setShouldLoadMapData(false);
    }
  }, [mapBounds, zoomLevel, mapLoading]);

  // API 호출 로직 분리 - shouldLoadMapData가 true일 때만 호출
  useEffect(() => {
    // 데이터 로드가 필요하지 않으면 종료
    if (!shouldLoadMapData || !mapBounds) return;

    // API 호출 횟수 제한 (선택적)
    if (apiCallCountRef.current > 30) {
      console.warn('너무 많은 API 호출 (30회 이상), 페이지를 새로고침 해주세요');
      return;
    }

    // 이전 타이머가 있으면 취소
    if (mapDataTimerRef.current) {
      clearTimeout(mapDataTimerRef.current);
    }

    // 1초 후에 데이터 로드 (지연)
    mapDataTimerRef.current = setTimeout(() => {
      loadMapData();
    }, 1000);

    return () => {
      if (mapDataTimerRef.current) {
        clearTimeout(mapDataTimerRef.current);
      }
    };
  }, [shouldLoadMapData, mapBounds, loadMapData]);

  // 지도 확장 상태 변경 시 지도 리사이즈 및 데이터 리로드
  useEffect(() => {
    // 지도 확장 상태가 변경되면 약간의 지연 후 데이터 로드 트리거
    const timer = setTimeout(() => {
      if (mapBounds) {
        setShouldLoadMapData(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isMapExpanded, mapBounds]);

  // 컴포넌트 마운트 시 맵 데이터 초기 로드
  useEffect(() => {
    if (mapBounds) {
      setShouldLoadMapData(true);
    }
  }, []);

  return (
    <div className='flex p-4'>
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* 사용자 프로필 정보 */}
        <div className='p-6 border-b'>
          <div className='flex items-center'>
            <div className='w-20 h-20 rounded-full border overflow-hidden mr-6'>
              <img
                src={user?.profileImage ?? '/test-profile.png'}
                alt='프로필 이미지'
                className='w-full h-full object-cover'
              />
            </div>

            <div>
              <h1 className='text-xl font-bold mb-2'>{user?.name || 'winter'}</h1>
              <div className='flex space-x-4 text-sm'>
                <div>게시물 {user?.diaryCount ?? diaries.length}</div>
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

        {/* 구글 맵 - 확장 상태에 따라 높이 조절 */}
        <div
          className={`relative overflow-hidden border rounded-md shadow-sm my-4 mx-6 transition-all duration-300 ${isMapExpanded ? 'h-[calc(100vh-200px)]' : 'h-[400px]'}`}
        >
          <GoogleMapComponent
            markers={mapMarkers}
            onZoomChanged={handleZoomChanged}
            onBoundsChanged={handleBoundsChanged}
            initialZoom={zoomLevel}
            isExpanded={isMapExpanded}
            onExpandMap={handleExpandMap}
            height={isMapExpanded ? undefined : '400px'}
          />

          {/* 맵 로딩 오버레이 */}
          {mapLoading && (
            <div className='absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900'></div>
            </div>
          )}

          {/* 맵 설명 오버레이 */}
          <div className='absolute top-2 left-2 bg-white px-3 py-1 rounded-md shadow-md text-xs'>
            {zoomLevel <= 13 ? '지역 클러스터 보기' : '개별 다이어리 보기'}
          </div>
        </div>

        {/* 공개된 다이어리 섹션 - 지도가 확장되었을 때는 숨김 */}
        {!isMapExpanded && (
          <div className='px-6 py-4'>
            <h3 className='text-lg font-bold mb-4'>공개된 다이어리</h3>

            {/* 다이어리 그리드 - 스크롤 가능한 별도 박스 */}
            <div className='overflow-y-auto max-h-[600px] pr-2 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100'>
              <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
                {diaries.length > 0 ? (
                  diaries.map((diary, index) => (
                    <div
                      key={diary.diaryId}
                      ref={index === diaries.length - 1 ? lastDiaryRef : null}
                    >
                      <DiaryCard diary={diary} />
                    </div>
                  ))
                ) : (
                  <EmptyState />
                )}
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
        )}
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
