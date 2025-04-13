// app/search/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleMapComponent from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { Diary } from '@root/types/diary';
import Link from 'next/link';

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

  // 정렬 방식 설정
  const sort = activeTab === '최신순' ? Diary.SortType.LATEST : Diary.SortType.POPULAR;

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

  // 초기 데이터 로드 및 탭/검색어 변경시 재로드
  useEffect(() => {
    setCursorId(undefined);
    setHasMore(true);
    fetchSearchResults(true);
  }, [query, activeTab]);

  // 무한 스크롤 설정
  useEffect(() => {
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
  }, [fetchSearchResults, hasMore, loading]);

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
    <div className='flex'>
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

          {/* 탭 메뉴 */}
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
        </div>

        {/* 구글 맵 영역 */}
        <div className='mt-4 relative rounded-lg overflow-hidden h-64'>
          {/* 구글 맵 컴포넌트 */}
          <GoogleMapComponent
            markers={diaries.map(diary => ({
              id: diary.diaryId,
              lat: diary.latitude,
              lng: diary.longitude,
              profileUrl: diary.thumbnailUrl,
            }))}
          />
        </div>

        {/* 다이어리 그리드 - 무한 스크롤을 위한 컨테이너 */}
        <div ref={diariesContainerRef} className='mt-6 overflow-y-auto max-h-[500px] pr-2'>
          <div className='grid grid-cols-3 gap-4'>
            {diaries.length === 0 && !loading ? (
              <div className='col-span-3 text-center py-8 text-gray-500'>검색 결과가 없습니다.</div>
            ) : (
              diaries.map((diary, index) => (
                <div key={diary.diaryId} ref={index === diaries.length - 1 ? lastDiaryRef : null}>
                  <Link
                    href={`/diaries/${diary.diaryId}`}
                    className='block border rounded-lg overflow-hidden hover:shadow-md transition'
                  >
                    <div className='h-40 bg-gray-200 relative'>
                      <img
                        src={diary.thumbnailUrl || '/diary-thumbnail-test.png'}
                        alt='다이어리 이미지'
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='p-3 text-sm text-center text-gray-700'>
                      <div>다이어리 여행,</div>
                      <div>
                        {diary.dongmyun}, {Diary.WeatherMap[diary.weatherInfo]}
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
