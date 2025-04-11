// app/search/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleMapComponent from '@/app/googleMap';
import { DiaryService } from '@root/services/diary';
import { MockUtil } from '@root/utils/mock.util';
import { Diary } from '@root/types/diary';
import Link from 'next/link';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = searchParams.get('page') || '1';
  const size = searchParams.get('size') || '6';
  const sort = searchParams.get('sort') || Diary.SortType.LATEST;
  const visibility = searchParams.get('visibility') || Diary.Visibility.PUBLIC;

  const [activeTab, setActiveTab] = useState<'최신순' | '인기순'>('최신순');
  const [searchQuery, setSearchQuery] = useState(query);
  const [diaries, setDiaries] = useState<Diary.Summary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(68);
  const [loading, setLoading] = useState(false);

  // 검색 결과 가져오기
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        // 실제 API 호출 부분 (현재는 목업 데이터 사용)
        const { list, pageInfo } = await DiaryService.getDiaries({
          page,
          size,
          sort,
          visibility,
        });
        setDiaries(list);
        setTotalPages(pageInfo.totalPages);
      } catch (error) {
        console.error('검색 결과를 가져오는 중 오류 발생:', error);
      }
    };

    if (query) {
      fetchSearchResults();
    } else {
      setDiaries(MockUtil.IDiary.Summaries(6));
    }
  }, [query, activeTab, currentPage]);

  // 검색 제출 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // 페이지 이동 핸들러
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo(0, 0);
    }
  };

  // 페이지네이션 렌더링 함수
  function renderPagination() {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    pages.push(
      <button
        key='prev'
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className='px-3 py-1 rounded text-gray-600 disabled:text-gray-300'
      >
        <span className='text-sm'>◀ Previous</span>
      </button>
    );

    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 mx-1 rounded-full ${
            i === currentPage ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {i}
        </button>
      );
    }

    // 다음 버튼
    pages.push(
      <button
        key='next'
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className='px-3 py-1 rounded text-gray-600 disabled:text-gray-300'
      >
        <span className='text-sm'>Next ▶</span>
      </button>
    );

    return pages;
  }

  return (
    <div className='flex'>
      {/* 중앙 컨텐츠 */}
      <div className='flex-1 p-4'>
        <div className='pb-4 border-b'>
          {/* 검색 폼 */}
          <form onSubmit={handleSearchSubmit} className='flex items-center max-w-md mx-auto mb-6'>
            <div className='relative flex items-center flex-grow'>
              <select className='absolute left-2 bg-transparent border-none appearance-none focus:outline-none'>
                <option>내용</option>
                <option>제목</option>
                <option>작성자</option>
              </select>
              <div className='absolute left-16 w-4 h-4 pointer-events-none'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-4 w-4 text-gray-500'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
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
              onClick={() => setActiveTab('최신순')}
              className={`flex-1 py-2 text-center border-b-2 ${activeTab === '최신순' ? 'border-gray-900 font-bold' : 'border-gray-200 text-gray-500'}`}
            >
              최신순
            </button>
            <button
              onClick={() => setActiveTab('인기순')}
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
              // count: 9,
            }))}
          />
        </div>

        {/* 다이어리 그리드 */}
        <div className='mt-6 grid grid-cols-3 gap-4'>
          {loading ? (
            <div className='col-span-3 flex justify-center py-8'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900'></div>
            </div>
          ) : diaries.length === 0 ? (
            <div className='col-span-3 text-center py-8 text-gray-500'>검색 결과가 없습니다.</div>
          ) : (
            diaries.map(diary => (
              <Link
                href={`/diaries/${diary.diaryId}`}
                key={diary.diaryId}
                className='block border rounded-lg overflow-hidden hover:shadow-md transition'
              >
                <div className='h-40 bg-gray-200 relative'>
                  <img
                    src={diary.thumbnailUrl || '/api/placeholder/300/200'}
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
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        <div className='mt-8 flex justify-center items-center space-x-1 py-4'>
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}
