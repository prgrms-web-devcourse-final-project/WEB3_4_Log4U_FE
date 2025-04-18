// app/search/page.tsx
'use client';

import GoogleMapComponent, { MapMarker } from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { MapService } from '@root/services/map';
import { Diary } from '@root/types/diary';
import { Map } from '@root/types/map';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';

// SearchContent 컴포넌트로 분리
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'최신순' | '인기순'>('최신순');
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchType, setSearchType] = useState<'내용' | '작가'>('내용');
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // 무한 스크롤을 위한 상태와 refs
  const [cursorId, setCursorId] = useState<number | undefined>(undefined);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastDiaryRef = useRef<HTMLDivElement | null>(null);
  const diariesContainerRef = useRef<HTMLDivElement | null>(null);

  // 지도 관련 상태 추가
  const [zoomLevel, setZoomLevel] = useState(11); // 기본 줌 레벨
  const [mapBounds, setMapBounds] = useState<{
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);

  const [mapLoading, setMapLoading] = useState(false);
  // 마커 데이터를 state로 관리
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);

  // API 호출 제어를 위한 상태 추가
  const [shouldLoadMapData, setShouldLoadMapData] = useState(false);
  // API 호출 제어를 위한 타이머 참조
  const mapDataTimerRef = useRef<NodeJS.Timeout | null>(null);
  // API 호출 횟수 제한을 위한 카운터
  const apiCallCountRef = useRef(0);
  // 마지막 API 호출 시간
  const lastApiCallTimeRef = useRef(0);

  // 정렬 방식 설정
  const sort = activeTab === '최신순' ? Diary.SortType.LATEST : Diary.SortType.POPULAR;

  // 지도 확장 상태 추가
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as '내용' | '작가';
    setSearchType(newType);

    // 타입이 변경되면 즉시 해당 페이지로 이동
    if (newType === '작가') {
      // 검색어가 있으면 쿼리와 함께, 없으면 그냥 이동
      if (searchQuery.trim()) {
        router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push('/users/search');
      }
    } else {
      if (searchQuery.trim()) {
        router.push(`/diaries/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push('/diaries/search');
      }
    }
  };

  // 검색 결과 가져오기
  const fetchSearchResults = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;

      setLoading(true);
      try {
        // API 호출 파라미터 설정
        const searchParams: Diary.GetListCursorDto = {
          keyword: query,
          sort: sort as Diary.SortType,
          cursorId: reset ? undefined : cursorId,
          size: 6,
        };

        const response = await DiaryService.getDiaries(searchParams);

        // 데이터 설정
        if (reset) {
          setDiaries(response.list);
        } else {
          setDiaries(prev => [...prev, ...response.list]);
        }

        // 다음 페이지 여부와 커서 설정
        setHasMore(response.pageInfo.hasNext);

        if (response.list.length > 0) {
          const lastDiary = response.list[response.list.length - 1];
          setCursorId(lastDiary.diaryId);
        }
      } catch (error) {
        console.error('검색 결과를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    },
    [query, sort, cursorId, loading]
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

      if (zoomLevel <= 13) {
        // 줌 레벨이 13 이하일 경우 클러스터 데이터 로드
        const clusters = await MapService.getMapCluster(query);
        console.log(`클러스터 데이터 로드 완료: ${clusters.length}개, 줌 레벨: ${zoomLevel}`);

        // diaryCount가 0인 클러스터는 제외
        const markers = clusters
          .filter(cluster => cluster.diaryCount > 0)
          .map(cluster => ({
            id: cluster.areaId,
            lat: cluster.lat,
            lng: cluster.lon,
            profileUrl: '/hot-logger.png', // 클러스터 아이콘
            count: cluster.diaryCount,
            title: `${cluster.areaName} (${cluster.diaryCount}개)`,
          }));

        console.log(`클러스터 마커 생성: ${markers.length}개`);
        setMapMarkers(markers);
      } else {
        // 줌 레벨이 14 이상일 경우 다이어리 데이터 로드
        const diaries = await MapService.getMapDiaries(query);
        console.log(`다이어리 데이터 로드 완료: ${diaries.length}개, 줌 레벨: ${zoomLevel}`);

        // 유효한 좌표가 있는 다이어리만 필터링
        const validDiaries = diaries.filter(
          diary => diary.lat && diary.lon && !isNaN(diary.lat) && !isNaN(diary.lon)
        );

        if (validDiaries.length !== diaries.length) {
          console.warn(
            `${diaries.length - validDiaries.length}개의 다이어리에 유효하지 않은 좌표가 있습니다.`
          );
        }

        const markers = validDiaries.map(diary => ({
          id: diary.diaryId,
          lat: diary.lat,
          lng: diary.lon,
          profileUrl: diary.thumbnailUrl || '/diary-thumbnail-test.png',
          title: diary.title,
        }));

        console.log(`다이어리 마커 생성: ${markers.length}개`);

        if (markers.length > 0) {
          setMapMarkers(markers);
        } else {
          console.warn('생성된 마커가 없습니다. API 응답 확인 필요');
          setMapMarkers([]);
        }
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
          setMapMarkers([]); // 마커 초기화
          setShouldLoadMapData(true);
        }
      }
    },
    [zoomLevel, mapBounds]
  );

  // 맵 확장 토글 핸들러
  const handleExpandMap = useCallback(() => {
    setIsMapExpanded(prev => !prev);
  }, []);

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

      console.log('맵 경계 변경:', {
        north: newBounds.north,
        south: newBounds.south,
        east: newBounds.east,
        west: newBounds.west,
      });

      // bounds 상태 업데이트
      setMapBounds(newBounds);

      // 데이터 로드 요청 플래그 설정
      setShouldLoadMapData(true);
    },
    [mapBounds, mapLoading]
  );

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

  // 초기 데이터 로드 및 탭/검색어 변경시 재로드
  useEffect(() => {
    setCursorId(undefined);
    setHasMore(true);
    fetchSearchResults(true);
  }, [query, activeTab]);

  // 지도 중심 좌표 추가
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
    lat: 37.5665, // 초기 서울 중심 좌표
    lng: 126.978,
  });

  // 중심 좌표 변경 핸들러 추가 - 스로틀링 적용
  const lastCenterChangeTimeRef = useRef<number>(0);

  const handleCenterChanged = useCallback(
    (newCenter: { lat: number; lng: number }) => {
      // 너무 빠른 연속 호출 방지 (최소 300ms 간격)
      const now = Date.now();
      if (now - lastCenterChangeTimeRef.current < 300) {
        return;
      }
      lastCenterChangeTimeRef.current = now;

      // 이전 중심점과 새 중심점이 너무 가까우면 업데이트 하지 않음
      if (
        Math.abs(newCenter.lat - mapCenter.lat) < 0.001 &&
        Math.abs(newCenter.lng - mapCenter.lng) < 0.001
      ) {
        return;
      }

      setMapCenter(newCenter);
    },
    [mapCenter]
  );

  // 무한 스크롤 설정
  useEffect(() => {
    // 지도가 확장되어 있을 때는 무한 스크롤 비활성화
    if (isMapExpanded) return;

    // 이전 옵저버 정리
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // 새 옵저버 생성
    observerRef.current = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          fetchSearchResults();
        }
      },
      {
        root: diariesContainerRef.current,
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
  }, [fetchSearchResults, hasMore, loading, isMapExpanded]);

  // 검색 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (searchType === '내용') {
        router.push(`/diaries/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  // 정렬 탭 변경 핸들러
  const handleTabChange = (tab: '최신순' | '인기순') => {
    setActiveTab(tab);
    setCursorId(undefined);
    setHasMore(true);
  };

  return (
    <div className='flex flex-col'>
      {/* 중앙 컨텐츠 */}
      <div className='flex-1 p-4'>
        <div className='pb-4 border-b'>
          {/* 검색 폼 */}
          <form onSubmit={handleSearchSubmit} className='flex items-center max-w-md mx-auto mb-6'>
            <div className='relative flex items-center flex-grow'>
              <select
                className='absolute left-2 bg-transparent border-none appearance-none focus:outline-none pr-5 z-10'
                value={searchType}
                onChange={handleSearchTypeChange}
              >
                <option value='내용'>내용</option>
                <option value='작가'>작가</option>
              </select>
              <div className='absolute left-12 w-4 h-4 pointer-events-none'>
                <svg className='h-4 w-4 text-gray-500' viewBox='0 0 20 20' fill='currentColor'>
                  <path
                    fillRule='evenodd'
                    d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='검색어를 입력하세요'
                className='pl-20 pr-10 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <button type='submit' className='ml-2 p-2 bg-gray-200 rounded-md hover:bg-gray-300'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-5 w-5 text-gray-700'
                viewBox='0 0 20 20'
                fill='currentColor'
              >
                <path
                  fillRule='evenodd'
                  d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                  clipRule='evenodd'
                />
              </svg>
            </button>
          </form>

          {/* 탭 메뉴 - 지도가 확장되었을 때는 숨김 */}
          {!isMapExpanded && (
            <div className='flex max-w-md mx-auto'>
              <button
                onClick={() => handleTabChange('최신순')}
                className={`flex-1 py-2 text-center border-b-2 ${activeTab === '최신순' ? 'border-gray-900 font-bold' : 'border-gray-200 text-gray-500'}`}
              >
                최신순
              </button>
              <button
                onClick={() => handleTabChange('인기순')}
                className={`flex-1 py-2 text-center border-b-2 ${activeTab === '인기순' ? 'border-gray-900 font-bold' : 'border-gray-200 text-gray-500'}`}
              >
                인기순
              </button>
            </div>
          )}
        </div>

        {/* 구글 맵 영역 - 확장 상태에 따라 크기 조절 */}
        <div
          className={`mt-4 relative rounded-lg overflow-hidden border shadow-sm transition-all duration-300 ${isMapExpanded ? 'h-[calc(100vh-150px)]' : 'h-[300px]'}`}
        >
          {/* 구글 맵 컴포넌트 - key 속성 제거로 불필요한 재생성 방지 */}
          <GoogleMapComponent
            markers={mapMarkers?.filter(marker => marker.lat && marker.lng) ?? []}
            onZoomChanged={handleZoomChanged}
            onBoundsChanged={handleBoundsChanged}
            onCenterChanged={handleCenterChanged}
            initialZoom={zoomLevel}
            initialCenter={mapCenter}
            isExpanded={isMapExpanded}
            onExpandMap={handleExpandMap}
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

          {/* API 호출 횟수 표시 (개발용, 프로덕션에서는 제거) */}
          {process.env.NODE_ENV === 'development' && (
            <div className='absolute bottom-2 left-2 bg-white px-3 py-1 rounded-md shadow-md text-xs'>
              API 호출: {apiCallCountRef.current}회
            </div>
          )}
        </div>

        {/* 다이어리 그리드 - 지도가 확장되었을 때는 숨김 */}
        {!isMapExpanded && (
          <div ref={diariesContainerRef} className='mt-6 overflow-y-auto max-h-[500px] pr-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {diaries.length === 0 && !loading ? (
                <div className='col-span-3 text-center py-8 text-gray-500'>
                  검색 결과가 없습니다.
                </div>
              ) : (
                diaries.map((diary, index) => (
                  <div key={diary.diaryId} ref={index === diaries.length - 1 ? lastDiaryRef : null}>
                    <Link
                      href={`/diaries/${diary.diaryId}`}
                      className='block border rounded-lg overflow-hidden hover:shadow-md transition h-full'
                    >
                      <div className='h-52 bg-gray-200 relative'>
                        <img
                          src={diary.thumbnailUrl || '/diary-thumbnail-test.png'}
                          alt='다이어리 이미지'
                          className='w-full h-full object-cover'
                        />
                        {/* 좋아요 수 */}
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
                        <h3 className='font-bold text-gray-800 truncate'>
                          {diary.title || '제목 없음'}
                        </h3>

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

                          {/* 위치 정보 */}
                          <div
                            className='truncate max-w-[120px]'
                            title={`${diary.location.sido || ''} ${diary.location.sigungu || ''} ${diary.location.eupmyeondong || ''}`}
                          >
                            {diary.location.sigungu && diary.location.eupmyeondong
                              ? `${diary.location.sigungu} ${diary.location.eupmyeondong}`
                              : diary.location.eupmyeondong ||
                                diary.location.sigungu ||
                                '위치 정보 없음'}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))
              )}
            </div>

            {/* 로딩 표시 */}
            {loading && (
              <div className='col-span-3 flex justify-center py-4'>
                <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900'></div>
              </div>
            )}

            {/* 더 이상 로딩할 데이터가 없을 때 */}
            {!hasMore && diaries.length > 0 && (
              <div className='col-span-3 text-center py-4 text-gray-500'>
                더 이상 표시할 다이어리가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 로딩 상태 컴포넌트
function SearchLoading() {
  return (
    <div className='flex justify-center items-center h-screen'>
      <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900'></div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
}
