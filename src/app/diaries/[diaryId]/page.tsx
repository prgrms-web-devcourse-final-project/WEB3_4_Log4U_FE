'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Diary } from '@root/types/diary';
import { DiaryService } from '@root/services/diary';
import { UserService } from '@root/services/user';
import { Comment } from '@root/types/comment';
import { User } from '@root/types/user';
import { ImageUtil } from '@root/utils/image.util';
import { MockUtil } from '@root/utils/mock.util';

export default function DiaryPage() {
  const router = useRouter();
  const params = useParams<{
    diaryId: string;
  }>();
  const { diaryId } = params;

  const [diary, setDiary] = useState<Diary.Detail | null>(null);
  const [user, setUser] = useState<User.Me | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [comments, setComments] = useState<Comment.Summary[]>([]);

  // 예시 댓글 데이터 - 백엔드 API 연동 전 임시 사용
  const mockComments: Comment.Summary[] = [
    {
      commentId: 1,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 101,
        nickname: 'ppakse',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 2,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 102,
        nickname: 'mjpark',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 3,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 103,
        nickname: 'leesom',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 4,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 104,
        nickname: 'rosy',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 5,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 105,
        nickname: 'mark',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 6,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 106,
        nickname: 'cr7',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
    {
      commentId: 7,
      content: 'good',
      createdAt: new Date().toISOString(),
      author: {
        userId: 107,
        nickname: 'dzew',
        thumbnailUrl: ImageUtil.randomPicture(40, 40),
      },
    },
  ];

  // 다이어리 데이터 가져오기
  useEffect(() => {
    const fetchDiary = async () => {
      setIsLoading(true);
      try {
        // const diary = await DiaryService.getDiary(diaryId);
        const [diary] = MockUtil.IDiary.Details(1);
        setDiary(diary);

        // 현재 사용자 정보 가져오기
        const user = await UserService.getMe();
        setUser(user);

        // 백엔드 API 연동 전 임시로 목업 댓글 데이터 사용
        // 실제로는 댓글 조회 API를 호출해야 함
        setComments(mockComments);
      } catch (err) {
        notFound();
        console.error('다이어리 정보를 불러오는 중 오류가 발생했습니다:', err);
        setError('다이어리를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiary();
  }, [params.diaryId]);

  // 다이어리 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm('정말로 이 다이어리를 삭제하시겠습니까?')) return;

    setIsActionLoading(true);

    try {
      if (!diary) {
        notFound();
      }
      await DiaryService.deleteDiary(diary.diaryId.toString());

      router.push('/diaries');
    } catch (err) {
      console.error('다이어리 삭제 중 오류 발생:', err);
      setError('다이어리를 삭제하는 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 신고 핸들러
  const handleReport = async () => {
    if (!confirm('이 다이어리를 신고하시겠습니까?')) return;

    setIsActionLoading(true);

    try {
      // @todo: 신고 API 호출
      alert('신고가 접수되었습니다.');
    } catch (err) {
      console.error('다이어리 신고 중 오류 발생:', err);
      setError('다이어리를 신고하는 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 댓글 제출 핸들러
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsActionLoading(true);

    try {
      // @todo: 댓글 생성 API 호출

      // 백엔드 API 연동 전 임시로 댓글 추가
      const newComment: Comment.Summary = {
        commentId: Date.now(),
        content: comment,
        createdAt: new Date().toISOString(),
        author: {
          userId: user?.userId ?? 0,
          nickname: 'me', // 실제로는 현재 사용자의 닉네임을 가져와야 함
          thumbnailUrl: ImageUtil.randomPicture(10, 10), // 실제로는 현재 사용자의 프로필 이미지를 가져와야 함
        },
      };

      setComments(prev => [...prev, newComment]);

      // 입력 필드 초기화
      setComment('');
    } catch (err) {
      console.error('댓글 작성 중 오류 발생:', err);
      setError('댓글을 작성하는 중 오류가 발생했습니다.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // 좋아요 처리 핸들러
  const handleLike = async () => {
    if (!diary) return;

    try {
      // @todo: 좋아요 API 호출

      // 임시로 좋아요 수 증가
      setDiary(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          likeCount: prev.likeCount + 1,
        };
      });
    } catch (err) {
      console.error('좋아요 처리 중 오류 발생:', err);
    }
  };

  // 화면 닫기 핸들러
  const handleClose = () => {
    router.push('/diaries');
  };

  // 숫자 포맷팅 (예: 1500 -> 1.5천개)
  const formatNumber = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}백만개`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천개`;
    }
    return `${count}개`;
  };

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md'>
          <p>{error}</p>
          <button
            onClick={() => router.push('/diaries')}
            className='mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition'
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md'>
          <p>다이어리를 찾을 수 없습니다.</p>
          <button
            onClick={() => router.push('/diaries')}
            className='mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition'
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 현재 사용자가 작성자인지 확인
  const isAuthor = diary.userId === user?.userId;

  return (
    <div className='flex h-screen'>
      {/* 좌측: 다이어리 이미지 */}
      <div className='w-3/5 bg-black relative'>
        {
          <img
            src={diary.thumbnailUrl ?? ImageUtil.randomPicture(800, 600)}
            alt='다이어리 썸네일'
            className='w-full h-full object-contain'
          />
        }
      </div>

      {/* 우측: 다이어리 정보 및 댓글 */}
      <div className='w-2/5 flex flex-col bg-white border-l'>
        {/* 헤더 */}
        <div className='p-4 border-b flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200'>
              {/* 실제 구현에서는 사용자 프로필 이미지 사용 */}
              <img
                src={user?.profileImage ?? ImageUtil.randomPicture(40, 40)}
                alt='프로필'
                className='w-full h-full object-cover'
              />
            </div>
            <div>
              <div className='font-bold'>winter</div>
              <div className='text-sm text-gray-600'>Seoul, korea</div>
            </div>
          </div>
          <button onClick={handleClose} className='text-gray-500'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className='p-4 border-b'>
          <p>
            {diary.content ||
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
          </p>
        </div>

        {/* 댓글 목록 */}
        <div className='flex-1 overflow-y-auto'>
          {comments.map(comment => (
            <div key={comment.commentId} className='p-4 border-b flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200'>
                  {comment.author.thumbnailUrl ? (
                    <img
                      src={comment.author.thumbnailUrl}
                      alt={`${comment.author.nickname}의 프로필`}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <img
                      src='/api/placeholder/40/40'
                      alt={`${comment.author.nickname}의 프로필`}
                      className='w-full h-full object-cover'
                    />
                  )}
                </div>
                <div className='flex items-center'>
                  <span className='font-medium mr-2'>{comment.author.nickname}</span>
                  <span className='text-gray-600'>{comment.content}</span>
                </div>
              </div>
              <button>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-5 w-5 text-gray-400'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
                  <path
                    fillRule='evenodd'
                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className='border-t'>
          <div className='p-3 flex space-x-4 border-b'>
            <button onClick={handleLike}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
                />
              </svg>
            </button>
            <button>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                />
              </svg>
            </button>
            <button>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className='h-6 w-6'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z'
                />
              </svg>
            </button>
            {isAuthor && (
              <div className='hidden absolute top-4 right-4 z-10 space-y-2'>
                <Link
                  href={`/diary/${diary.diaryId}/edit`}
                  className='block px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isActionLoading}
                  className='block w-full px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50'
                >
                  {isActionLoading ? '처리 중...' : '삭제'}
                </button>
              </div>
            )}

            {/* 작성자가 아닐 경우 신고 버튼 (화면 외부에 배치) */}
            {!isAuthor && (
              <div className='hidden absolute top-4 right-4 z-10'>
                <button
                  onClick={handleReport}
                  disabled={isActionLoading}
                  className='px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:opacity-50'
                >
                  {isActionLoading ? '처리 중...' : '신고'}
                </button>
              </div>
            )}
          </div>

          {/* 좋아요 수 및 날짜 */}
          <div className='p-3'>
            <div className='font-medium text-sm'>
              좋아요 {formatNumber(diary.likeCount || 162900)}
            </div>
            <div className='text-xs text-gray-500 mt-1'>1일 전</div>
          </div>

          {/* 댓글 입력창 */}
          <form onSubmit={handleCommentSubmit} className='p-3 border-t flex'>
            <input
              type='text'
              placeholder='댓글 달기...'
              className='flex-1 focus:outline-none'
              value={comment}
              onChange={e => setComment(e.target.value)}
              disabled={isActionLoading}
            />
            <button
              type='submit'
              className='px-2 py-1 bg-gray-800 text-white text-sm rounded disabled:opacity-50'
              disabled={!comment.trim() || isActionLoading}
            >
              전송
            </button>
          </form>
        </div>
      </div>

      {/* 작성자일 경우 수정/삭제 버튼 (화면 외부에 배치하여 필요할 때 CSS로 표시) */}
    </div>
  );
}
