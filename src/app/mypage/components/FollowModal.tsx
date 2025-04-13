'use client';

import { useEffect, useState, useRef } from 'react';
import { FollowService } from '@root/services/follow';
import { User } from '@root/types/user';

// 팔로워/팔로잉 모달 컴포넌트
interface FollowModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isFollowers: boolean;
  onUnfollow: (nickname: string) => Promise<void>;
}

const FollowModal: React.FC<FollowModalProps> = ({
  isOpen,
  onClose,
  title,
  isFollowers,
  onUnfollow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [follows, setFollows] = useState<User.IFollowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowLoading, setUnfollowLoading] = useState<{ [key: string]: boolean }>({});
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFollows = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const response = isFollowers
          ? await FollowService.getFollowers()
          : await FollowService.getFollowings();
        setFollows(response.list || []);
      } catch (error) {
        console.error(`${isFollowers ? '팔로워' : '팔로잉'} 목록을 가져오는 중 오류 발생:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollows();
  }, [isOpen, isFollowers]);

  // 외부 클릭 시 모달 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 언팔로우 처리
  const handleUnfollow = async (nickname: string) => {
    setUnfollowLoading(prev => ({ ...prev, [nickname]: true }));
    try {
      await onUnfollow(nickname);
      // 목록에서 제거
      setFollows(follows.filter(user => user.nickname !== nickname));
    } catch (error) {
      console.error('언팔로우 실패:', error);
    } finally {
      setUnfollowLoading(prev => ({ ...prev, [nickname]: false }));
    }
  };

  // 검색어로 필터링
  const filteredFollows = follows.filter(follow =>
    follow.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center'>
      <div
        ref={modalRef}
        className='rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col border-2'
        style={{
          backgroundColor: 'var(--color-neutral)',
          borderColor: 'black',
        }}
      >
        {/* 모달 헤더 */}
        <div
          className='border-b px-4 py-3 flex items-center justify-between'
          style={{ borderColor: 'var(--color-secondary)' }}
        >
          <h3 className='text-xl font-semibold' style={{ color: 'var(--color-primary)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className='hover:opacity-75'
            style={{ color: 'var(--color-primary)' }}
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M6 18L18 6M6 6l12 12'
              ></path>
            </svg>
          </button>
        </div>

        {/* 검색 영역 */}
        <div className='p-4 border-b' style={{ borderColor: 'var(--color-secondary)' }}>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                style={{ color: 'var(--color-primary)' }}
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                ></path>
              </svg>
            </div>
            <input
              type='text'
              className='pl-10 w-full border rounded-lg py-2 focus:outline-none focus:ring-2'
              style={
                {
                  backgroundColor: 'var(--color-secondary)',
                  borderColor: 'var(--color-primary)',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties
              }
              placeholder='검색'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 목록 영역 */}
        <div className='flex-1 overflow-y-auto'>
          {loading ? (
            <div className='flex justify-center items-center py-8'>
              <div
                className='animate-spin rounded-full h-8 w-8 border-t-2 border-b-2'
                style={{ borderColor: 'var(--color-primary)' }}
              ></div>
            </div>
          ) : filteredFollows.length === 0 ? (
            <div className='text-center py-8' style={{ color: 'var(--color-text)' }}>
              {searchTerm
                ? '검색 결과가 없습니다.'
                : `${isFollowers ? '팔로워' : '팔로잉'}가 없습니다.`}
            </div>
          ) : (
            <ul className='divide-y' style={{ borderColor: 'var(--color-secondary)' }}>
              {filteredFollows.map(follow => (
                <li key={follow.userId} className='px-4 py-3 flex items-center justify-between'>
                  <div className='flex items-center'>
                    <div className='w-12 h-12 rounded-full overflow-hidden'>
                      <img
                        src={follow.thumbNail || '/test-profile.png'}
                        alt={`${follow.nickname}의 프로필`}
                        className='w-full h-full object-cover'
                      />
                    </div>
                    <div className='ml-3'>
                      <div className='font-medium' style={{ color: 'var(--color-text)' }}>
                        {follow.nickname}
                      </div>
                    </div>
                  </div>
                  {!isFollowers && (
                    <button
                      onClick={() => handleUnfollow(follow.nickname)}
                      disabled={unfollowLoading[follow.nickname]}
                      className='ml-2 hover:opacity-80'
                      style={{ color: 'var(--color-accent)' }}
                    >
                      {unfollowLoading[follow.nickname] ? (
                        <div
                          className='animate-spin rounded-full h-5 w-5 border-t-2'
                          style={{ borderColor: 'var(--color-accent)' }}
                        ></div>
                      ) : (
                        <svg
                          className='w-5 h-5'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth='2'
                            d='M6 18L18 6M6 6l12 12'
                          ></path>
                        </svg>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
