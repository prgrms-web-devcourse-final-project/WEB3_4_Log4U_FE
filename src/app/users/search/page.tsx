'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { UserService } from '@root/services/user';
import { User } from '@root/types/user';
import { Pagination } from '@root/types/pagination';
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
            src={user.profileImage || '/test-profile.png'}
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

export default function UserSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(query);
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
    router.push(`/users/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // 유저 검색 데이터 가져오기
  const fetchUsers = useCallback(
    async (reset = false) => {
      if (loading && !reset) return;

      setLoading(true);
      try {
        const params: Pagination.CursorDto = {
          size: 20,
        };

        if (!reset && cursorId) {
          params.cursorId = cursorId;
        }

        const response = await UserService.getUsers(searchQuery);

        if (reset) {
          setUsers(response.list || []);
        } else {
          setUsers(prev => [...prev, ...(response.list || [])]);
        }

        setHasMore(response.pageInfo.hasNext);
        if (response.pageInfo.hasNext) {
          setCursorId(response.pageInfo.nextCursor);
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
        <form onSubmit={handleSearch} className='mb-6'>
          <div className='relative'>
            <input
              type='text'
              placeholder='사용자 검색...'
              className='w-full border border-gray-300 rounded-lg py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-gray-900'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <svg
              className='w-5 h-5 absolute left-3 top-2.5 text-gray-500'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
            >
              <path
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <button type='submit' className='absolute right-3 top-2 text-gray-500'>
              <svg
                className='w-5 h-5'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path d='M5 12h14M12 5l7 7-7 7' strokeLinecap='round' strokeLinejoin='round' />
              </svg>
            </button>
          </div>
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
