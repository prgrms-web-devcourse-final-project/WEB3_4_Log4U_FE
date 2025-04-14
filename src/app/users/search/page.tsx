'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { UserService } from '@root/services/user';
import { User } from '@root/types/user';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface UserItemProps {
  user: User.ISummary;
}

const UserItem = ({ user }: UserItemProps) => {
  return (
    <div className='flex items-center py-3 border-b border-gray-200 w-full'>
      <Link href={`/users/${user.nickname}`} className='flex items-center w-full'>
        <div className='w-12 h-12 rounded-full overflow-hidden mr-4'>
          <img
            src={user?.profileImage ?? '/public/test-profile.svg'}
            alt={`${user.nickname}의 프로필`}
            className='w-full h-full object-cover'
          />
        </div>
        <div className='flex-1'>
          <div className='font-medium'>{user.nickname}</div>
          <div className='text-sm text-gray-500'>{user.statusMessage || '소개글이 없습니다'}</div>
          <div className='text-xs text-gray-400'>팔로워 {user.followers}명</div>
        </div>
      </Link>
    </div>
  );
};

// 로딩 상태 컴포넌트
function UserSearchLoading() {
  return (
    <div className='flex justify-center items-center h-[300px]'>
      <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900'></div>
    </div>
  );
}

// 실제 검색 기능을 수행하는 컴포넌트
function UserSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
  const [searchType, setSearchType] = useState<'작가' | '내용'>('작가');
  const [users, setUsers] = useState<User.ISummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursorId, setCursorId] = useState<number | undefined>(undefined);

  // 무한 스크롤을 위한 상태와 refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastUserRef = useRef<HTMLDivElement | null>(null);

  // 검색 폼 제출 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (searchType === '작가') {
      router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push(`/diaries/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as '작가' | '내용';
    setSearchType(newType);

    // 타입이 변경되면 즉시 해당 페이지로 이동
    if (newType === '내용') {
      // 검색어가 있으면 쿼리와 함께, 없으면 그냥 이동
      if (searchQuery.trim()) {
        router.push(`/diaries/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push('/diaries/search');
      }
    } else {
      if (searchQuery.trim()) {
        router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push('/users/search');
      }
    }
  };

  // 유저 검색 데이터 가져오기
  const fetchUsers = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;
      if (!searchQuery.trim() && !reset) return;

      setLoading(true);
      try {
        const queryParams: Partial<User.GetListQueryDto> = {
          size: 20,
        };

        if (!reset && cursorId) {
          queryParams.cursor = cursorId;
        }

        if (searchQuery.trim()) {
          queryParams.nickname = searchQuery;
        }

        // TypeScript 캐스팅으로 타입 에러 해결
        const response = await UserService.getUserList(queryParams as User.GetListQueryDto);

        if (reset) {
          setUsers(response.list || []);
        } else {
          setUsers(prev => [...prev, ...(response.list || [])]);
        }

        setHasMore(response.pageInfo.hasNext);
        if (response.pageInfo.hasNext) {
          setCursorId(response.pageInfo.nextCursor);
        } else {
          setCursorId(undefined);
        }
      } catch (error) {
        console.error('사용자 검색 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, cursorId, loading]
  );

  // 초기 데이터 로드
  useEffect(() => {
    setSearchQuery(query);
    setCursorId(undefined);
    fetchUsers(true);
  }, [query]);

  // 무한 스크롤 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchUsers();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [fetchUsers, hasMore, loading]);

  // 마지막 유저 아이템 관찰
  useEffect(() => {
    if (lastUserRef.current && observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current.observe(lastUserRef.current);
    }
  }, [users]);

  return (
    <div className='w-full h-full flex flex-col overflow-y-auto'>
      <div className='p-4 max-w-3xl mx-auto w-full'>
        {/* 검색 입력 */}
        <form onSubmit={handleSearch} className='flex items-center max-w-md mx-auto mb-6'>
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
              placeholder='검색어를 입력하세요'
              className='pl-20 pr-10 py-2 w-full border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button type='submit' className='ml-2 p-2 bg-gray-200 rounded-md hover:bg-gray-300'>
            <svg className='h-5 w-5 text-gray-700' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        </form>

        {/* 사용자 목록 */}
        <div className='space-y-2'>
          {users.length === 0 && !loading ? (
            <div className='text-center py-10 text-gray-500'>
              {query ? `'${query}'에 대한 검색 결과가 없습니다.` : '검색어를 입력하세요.'}
            </div>
          ) : (
            users.map((user, index) => (
              <div key={user.userId} ref={index === users.length - 1 ? lastUserRef : null}>
                <UserItem user={user} />
              </div>
            ))
          )}

          {/* 로딩 표시 */}
          {loading && (
            <div className='flex justify-center py-4'>
              <div className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900'></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트 - Suspense로 감싸서 useSearchParams() 에러 해결
export default function UserSearchPage() {
  return (
    <Suspense fallback={<UserSearchLoading />}>
      <UserSearchContent />
    </Suspense>
  );
}
