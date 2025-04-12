'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Diary } from '@root/types/diary';
import { DiaryService } from '@root/services/diary';
import { UserService } from '@root/services/user';
import { Comment } from '@root/types/comment';
import { User } from '@root/types/user';
import { CommentService } from '@root/services/comments';

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

  // 무한 스크롤을 위한 상태 추가
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);

  // 댓글 불러오기 함수
  const fetchComments = useCallback(
    async (cursorId?: number) => {
      if (commentsLoading) return;

      setCommentsLoading(true);
      try {
        const query: Comment.GetListCursorDto = {
          size: 10,
          cursorCommentId: cursorId,
        };

        const commentsData = await CommentService.getComments(diaryId, query);

        if (cursorId) {
          // 기존 댓글에 추가
          setComments(prev => [...prev, ...commentsData.list]);
        } else {
          // 처음 로딩할 때는 새로 세팅
          setComments(commentsData.list);
        }

        // 더 불러올 댓글이 있는지 확인
        setHasMore(commentsData.pageInfo.hasNext);

        // 다음 요청에 사용할 커서 업데이트
        if (commentsData.list.length > 0) {
          const lastComment = commentsData.list[commentsData.list.length - 1];
          setCursor(lastComment.commentId);
        }
      } catch (err) {
        console.error('댓글 로딩 중 오류 발생:', err);
      } finally {
        setCommentsLoading(false);
      }
    },
    [diaryId, commentsLoading]
  );

  // 스크롤 이벤트 핸들러
  const handleCommentsScroll = useCallback(() => {
    if (!commentsContainerRef.current || commentsLoading || !hasMore) return;

    const container = commentsContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // 스크롤이 하단 20px 이내에 도달했을 때 추가 댓글 로드
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      fetchComments(cursor);
    }
  }, [cursor, fetchComments, commentsLoading, hasMore]);

  // 다이어리 데이터 가져오기
  useEffect(() => {
    const fetchDiary = async () => {
      setIsLoading(true);
      setError('');

      try {
        // 다이어리 상세 정보 가져오기
        const diaryData = await DiaryService.getDiary(diaryId);
        setDiary(diaryData);

        // 현재 사용자 정보 가져오기
        const userData = await UserService.getMe();
        setUser(userData);

        // 최초 댓글 목록 가져오기
        fetchComments();
      } catch (error) {
        console.error('다이어리 로딩 중 오류 발생:', error);
        setError('다이어리를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiary();
  }, []);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const currentRef = commentsContainerRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleCommentsScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleCommentsScroll);
      }
    };
  }, [handleCommentsScroll]);

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
      // 실제 댓글 API 호출
      const newComment = await CommentService.createComment(diaryId, comment);

      // 새 댓글을 목록 맨 위에 추가
      setComments(prev => [newComment, ...prev]);
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
      // const response = await DiaryService.likeDiary(diary.diaryId);

      // 임시: 좋아요 수 증가 UI만 반영
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

  // 날짜 포맷팅
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '날짜 정보 없음';

    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // 1일 이내
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      if (hours < 1) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes === 0 ? 1 : minutes}분 전`;
      }
      return `${hours}시간 전`;
    }

    // 7일 이내
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      return `${days}일 전`;
    }

    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 현재 사용자가 작성자인지 확인
  const isAuthor = diary?.userId === user?.userId;

  // 다이어리 작성자 정보 표시 (타입 오류 수정)
  const authorName = diary?.userId?.toString() === user?.userId ? user?.name : '다른 사용자';
  const locationText = diary?.dongmyun || '위치 정보 없음';

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

  return (
    <div className='flex h-screen'>
      {/* 좌측: 다이어리 이미지 */}
      <div className='w-3/5 bg-black relative'>
        {diary.thumbnailUrl ? (
          <img
            src={diary.thumbnailUrl}
            alt='다이어리 썸네일'
            className='w-full h-full object-contain'
          />
        ) : (
          <div className='w-full h-full flex items-center justify-center text-gray-500'>
            이미지가 없습니다
          </div>
        )}
      </div>

      {/* 우측: 다이어리 정보 및 댓글 */}
      <div className='w-2/5 flex flex-col bg-white border-l'>
        {/* 헤더 */}
        <div className='p-4 border-b flex items-center justify-between'>
          <div className='flex items-center'>
            <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200'>
              {diary.thumbnailUrl ? (
                <img src={diary.thumbnailUrl} alt='프로필' className='w-full h-full object-cover' />
              ) : (
                <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs'>
                  No image
                </div>
              )}
            </div>
            <div>
              <div className='font-bold'>{authorName}</div>
              <div className='text-sm text-gray-600'>{locationText}</div>
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
          <h2 className='text-xl font-bold mb-2'>{diary.title}</h2>
          <p>{diary.content || '내용이 없습니다.'}</p>

          {/* 다이어리 메타 정보 */}
          {diary.weatherInfo && (
            <div className='mt-2 text-sm text-gray-600'>
              <span className='mr-2'>
                날씨: {Diary.WeatherMap[diary.weatherInfo] || diary.weatherInfo}
              </span>
              {/* temperature 프로퍼티가 없으므로 주석 처리 */}
              {/* {diary.temperature !== undefined && <span>온도: {diary.temperature}°C</span>} */}
            </div>
          )}
        </div>

        {/* 댓글 목록 - 무한 스크롤 적용 */}
        <div ref={commentsContainerRef} className='flex-1 overflow-y-auto'>
          {comments.length > 0 ? (
            comments.map(comment => (
              <div
                key={comment.commentId}
                className='p-4 border-b flex items-center justify-between'
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200'>
                    {comment.author?.thumbnailUrl ? (
                      <img
                        src={comment.author?.thumbnailUrl}
                        alt={`${comment.author?.nickname}의 프로필`}
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs'>
                        No image
                      </div>
                    )}
                  </div>
                  <div className='flex items-center'>
                    <span className='font-medium mr-2'>{comment.author?.nickname}</span>
                    <span className='text-gray-600'>{comment.content}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className='p-4 text-center text-gray-500'>
              댓글이 없습니다. 첫 댓글을 작성해보세요!
            </div>
          )}

          {/* 댓글 로딩 표시 */}
          {commentsLoading && (
            <div className='p-4 text-center'>
              <div className='inline-block animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500'></div>
              <span className='ml-2 text-sm text-gray-500'>댓글 불러오는 중...</span>
            </div>
          )}

          {/* 더 이상 불러올 댓글이 없음을 표시 */}
          {!commentsLoading && !hasMore && comments.length > 0 && (
            <div className='p-3 text-center text-sm text-gray-500'>더 이상 댓글이 없습니다.</div>
          )}
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

            {/* 수정/삭제 버튼 */}
            {isAuthor && (
              <div className='ml-auto flex space-x-2'>
                <Link
                  href={`/diaries/${diary.diaryId}/edit`}
                  className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition'
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isActionLoading}
                  className='px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50'
                >
                  {isActionLoading ? '처리 중...' : '삭제'}
                </button>
              </div>
            )}

            {/* 작성자가 아닐 경우 신고 버튼 */}
            {!isAuthor && (
              <div className='ml-auto'>
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
            <div className='font-medium text-sm'>좋아요 {formatNumber(diary.likeCount || 0)}</div>
            <div className='text-xs text-gray-500 mt-1'>{formatDate(diary.createdAt)}</div>
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
    </div>
  );
}
