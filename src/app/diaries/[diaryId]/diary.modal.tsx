'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Diary } from '@root/types/diary';
import { Comment } from '@root/types/comment';
import { User } from '@root/types/user';
import { CommentService } from '@root/services/comments';
import { LikeService } from '@root/services/like';
import { ReportService } from '@root/services/report';
import { Report } from '@root/types/report';
import { DiaryService } from '@root/services/diary';
import { Pagination } from '@root/types/pagination';
import assert from 'assert';

interface DiaryModalProps {
  diary: Diary.Detail | null;
  user: User.Me | null;
  diaryId: string;
  isAuthor: boolean;
  onClose: () => void;
}

export default function DiaryModal({ diary, user, diaryId, isAuthor, onClose }: DiaryModalProps) {
  const router = useRouter();

  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  // 에러 메시지 상태 (알림으로 표시)
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [comments, setComments] = useState<Comment.Summary[]>([]);

  // 신고 모달 관련 상태
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportType, setReportType] = useState<Report.Type>(Report.Type.INAPPROPRIATE_CONTENT);
  const [reportContent, setReportContent] = useState<string>('');
  const reportModalRef = useRef<HTMLDivElement>(null);

  // 댓글 신고 관련 상태
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [isCommentReport, setIsCommentReport] = useState<boolean>(false);

  // 무한 스크롤을 위한 상태 추가
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const commentsContainerRef = useRef<HTMLDivElement | null>(null);

  // 좋아요 상태 관리
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(diary?.likeCount || 0);

  // 모달 참조 및 외부 클릭 처리
  const modalRef = useRef<HTMLDivElement>(null);

  // 댓글 불러오기 함수
  const fetchComments = useCallback(
    async (cursorId?: number) => {
      if (commentsLoading || !diaryId) return;

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
        setErrorMessage('댓글을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setCommentsLoading(false);
      }
    },
    [diaryId, commentsLoading]
  );

  // 처음 마운트될 때 댓글 로드
  useEffect(() => {
    if (diary) {
      fetchComments();
      setLikeCount(diary.likeCount || 0);
    }
  }, []);

  // 스크롤 이벤트 핸들러
  const handleCommentsScroll = useCallback(() => {
    if (!commentsContainerRef.current || commentsLoading || !hasMore) return;

    const container = commentsContainerRef.current;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // 스크롤이 하단 20px 이내에 도달했을 때 추가 댓글 로드
    if (
      scrollHeight - scrollTop <= clientHeight + 20 &&
      comments.length < Pagination.DEFAULT_SIZE
    ) {
      fetchComments(cursor);
    }
  }, [cursor, fetchComments, commentsLoading, hasMore]);

  // 스크롤 이벤트 리스너 등록
  useEffect(
    () => {
      const currentRef = commentsContainerRef.current;
      if (currentRef) {
        currentRef.addEventListener('scroll', handleCommentsScroll);
      }

      return () => {
        if (currentRef) {
          currentRef.removeEventListener('scroll', handleCommentsScroll);
        }
      };
    },
    [
      // handleCommentsScroll
    ]
  );

  // ESC 키 눌렀을 때 모달 닫기
  useEffect(() => {
    const handleEscKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKeyPress);
    // body 스크롤 방지
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEscKeyPress);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 다이어리 삭제 핸들러
  const handleDelete = async () => {
    if (!confirm('정말로 이 다이어리를 삭제하시겠습니까?')) return;

    setIsActionLoading(true);

    try {
      assert(diary, '다이어리가 존재하지 않습니다.');
      await DiaryService.deleteDiary(diary.diaryId);

      router.push('/diaries');
    } catch (err) {
      console.error('다이어리 삭제 중 오류 발생:', err);
      const errorMsg = '다이어리를 삭제하는 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 신고 핸들러
  const handleReport = () => {
    setIsCommentReport(false);
    setSelectedCommentId(null);
    setShowReportModal(true);
  };

  // 댓글 신고 핸들러
  const handleCommentReport = (commentId: number) => {
    setIsCommentReport(true);
    setSelectedCommentId(commentId);
    setShowReportModal(true);
  };

  // 신고 제출
  const handleSubmitReport = async () => {
    if (!reportType) {
      alert('신고 이유를 선택해주세요.');
      return;
    }

    setIsActionLoading(true);

    try {
      const reportData: Report.CreateDto = {
        reportType: reportType,
        content: reportContent,
      };

      if (isCommentReport && selectedCommentId) {
        // 댓글 신고 - API가 구현됨
        await ReportService.reportComment(selectedCommentId.toString(), reportData);
      } else {
        // 다이어리 신고
        await ReportService.reportDiary(diaryId, reportData);
      }
      alert('신고가 접수되었습니다.');
      handleCloseReportModal();
    } catch (err) {
      console.error('신고 중 오류 발생:', err);
      const errorMsg = isCommentReport
        ? '댓글 신고 중 오류가 발생했습니다.'
        : '다이어리를 신고하는 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 신고 모달 닫기
  const handleCloseReportModal = () => {
    setShowReportModal(false);
    setReportType(Report.Type.INAPPROPRIATE_CONTENT);
    setReportContent('');
    setIsCommentReport(false);
    setSelectedCommentId(null);
  };

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reportModalRef.current && !reportModalRef.current.contains(event.target as Node)) {
        handleCloseReportModal();
      }
    };

    if (showReportModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showReportModal]);

  // 댓글 제출 핸들러
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsActionLoading(true);

    try {
      const newComment = await CommentService.createComment(diaryId, comment);

      // 새 댓글을 목록 맨 위에 추가
      setComments(prev => [newComment, ...prev]);
      setComment('');
    } catch (err) {
      console.error('댓글 작성 중 오류 발생:', err);
      const errorMsg = '댓글을 작성하는 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      alert(errorMsg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      // 댓글 삭제 API 호출
      await CommentService.deleteComment(commentId.toString());

      // 댓글 목록에서 삭제된 댓글 제거
      setComments(prev => prev.filter(comment => comment.commentId !== commentId));
      alert('댓글이 삭제되었습니다.');
    } catch (err) {
      console.error('댓글 삭제 중 오류 발생:', err);
      const errorMsg = '댓글을 삭제하는 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
      alert(errorMsg);
    }
  };

  // 좋아요 처리 핸들러
  const handleLike = async () => {
    if (!diary || !user) return;

    try {
      if (isLiked) {
        // 좋아요가 이미 되어 있으면 좋아요 취소
        await LikeService.deleteLike(diary.diaryId);

        // 상태 업데이트
        setIsLiked(false);
        setLikeCount(prev => Math.max(prev - 1, 0)); // 음수가 되지 않도록
      } else {
        // 좋아요가 되어 있지 않으면 좋아요 등록
        await LikeService.createLike(diary.diaryId);

        // 상태 업데이트
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('좋아요 처리 중 오류 발생:', err);
      const errorMsg = '좋아요 처리 중 오류가 발생했습니다.';
      setErrorMessage(errorMsg);
    }
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

  if (!diary) {
    return null;
  }

  // 다이어리 작성자 정보 표시
  const authorName = diary.authorNickname;
  const locationText = diary?.dongmyun || '위치 정보 없음';

  // 현재 로그인한 사용자 ID
  const currentUserId = user?.userId;

  // 에러 메시지 표시
  if (errorMessage) {
    // 에러 메시지는 alert()로 표시하고 있으므로 여기서는 초기화만 함
    setErrorMessage('');
  }

  return (
    <div className='fixed inset-0 bg-opacity-75 z-50 flex justify-center items-center p-4'>
      <div
        ref={modalRef}
        className='flex w-full max-w-6xl h-[80vh] bg-white rounded-lg overflow-hidden shadow-xl'
      >
        {/* 좌측: 다이어리 이미지 */}
        <div className='w-3/5 bg-black relative'>
          <img
            src={diary.thumbnailUrl}
            alt='다이어리 썸네일'
            className='w-full h-full object-contain'
          />
        </div>

        {/* 우측: 다이어리 정보 및 댓글 */}
        <div className='w-2/5 flex flex-col bg-white'>
          {/* 헤더 */}
          <div className='p-4 border-b flex items-center justify-between'>
            <div className='flex items-center'>
              <Link href={`/users/${diary.authorNickname}/profile`} className='flex items-center'>
                <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200'>
                  <img
                    src={diary.authorProfileImage}
                    alt='프로필'
                    className='w-full h-full object-cover'
                  />
                </div>
                <div>
                  <div className='font-bold'>{authorName}</div>
                  <div className='text-sm text-gray-600'>{locationText}</div>
                </div>
              </Link>
            </div>
            <button onClick={onClose} className='text-gray-500'>
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
              </div>
            )}
          </div>

          {/* 댓글 목록 - 무한 스크롤 적용 */}
          <div ref={commentsContainerRef} className='flex-1 overflow-y-auto'>
            {comments.length > 0 ? (
              comments.map(comment => (
                <div key={comment.commentId} className='p-4 border-b'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start'>
                      <div className='w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex-shrink-0'>
                        {comment.userProfileImage ? (
                          <img
                            src={comment.userProfileImage}
                            alt={`${comment.userName}의 프로필`}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-full w-full text-gray-400 bg-gray-300'
                            viewBox='0 0 20 20'
                            fill='currentColor'
                          >
                            <path
                              fillRule='evenodd'
                              d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'
                              clipRule='evenodd'
                            />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div className='flex items-baseline'>
                          <span className='font-medium mr-2'>{comment.userName}</span>
                          <span className='text-xs text-gray-500'>
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <div className='text-gray-700 mt-1'>{comment.content}</div>
                      </div>
                    </div>

                    {/* 내 댓글이면 삭제 버튼, 아니면 신고 버튼 */}
                    <div>
                      {currentUserId === comment.userId ? (
                        <button
                          onClick={() => handleDeleteComment(comment.commentId)}
                          className='text-gray-500 hover:text-red-500'
                          title='댓글 삭제'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M3 6h18'></path>
                            <path d='M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6'></path>
                            <path d='M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2'></path>
                            <line x1='10' y1='11' x2='10' y2='17'></line>
                            <line x1='14' y1='11' x2='14' y2='17'></line>
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCommentReport(comment.commentId)}
                          className='text-gray-500 hover:text-orange-500'
                          title='댓글 신고'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-5 w-5'
                            viewBox='0 0 24 24'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          >
                            <path d='M12 2.69l5.66 5.66a8 8 0 11-11.31 0z'></path>
                            <line x1='12' y1='9' x2='12' y2='13'></line>
                            <line x1='12' y1='17' x2='12.01' y2='17'></line>
                          </svg>
                        </button>
                      )}
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
            <div className='p-3 flex items-center border-b'>
              <button
                onClick={handleLike}
                className='focus:outline-none transition-colors duration-200 text-red-500 block mr-2'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill={isLiked ? 'currentColor' : 'none'}
                  viewBox='0 0 20 20'
                  stroke='currentColor'
                  style={{ transform: 'scale(1.2)' }}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z'
                  />
                </svg>
              </button>
              <button className='mr-2 block'>
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 20 20'
                  stroke='currentColor'
                  style={{ transform: 'scale(1.2)' }}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z'
                  />
                </svg>
              </button>

              {/* 수정/삭제 버튼 (작성자인 경우) */}
              {isAuthor && (
                <>
                  <Link
                    href={`/diaries/${diary.diaryId}/edit`}
                    className='w-6 h-6 transition hover:opacity-80 block mr-2'
                    title='수정'
                  >
                    <img src='/edit.png' alt='수정' className='w-full h-full object-contain' />
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={isActionLoading}
                    className='w-6 h-6 transition hover:opacity-80 disabled:opacity-50 block'
                    title='삭제'
                  >
                    <img src='/delete.png' alt='삭제' className='w-full h-full object-contain' />
                  </button>
                </>
              )}

              {/* 신고 버튼 (작성자가 아닐 경우) */}
              {!isAuthor && (
                <button
                  onClick={handleReport}
                  disabled={isActionLoading}
                  className='w-6 h-6 transition hover:opacity-80 disabled:opacity-50'
                  title='신고'
                >
                  <img src='/report.png' alt='신고' className='w-full h-full object-contain' />
                </button>
              )}
            </div>

            {/* 좋아요 수 및 날짜 */}
            <div className='p-3'>
              <div className='font-medium text-sm'>좋아요 {formatNumber(likeCount)}</div>
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
                게시
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 신고 모달 */}
      {showReportModal && (
        <div className='fixed inset-0 bg-opacity-50 flex justify-center items-center z-50'>
          <div ref={reportModalRef} className='bg-white rounded-lg w-96 p-6 shadow-xl'>
            <div className='text-xl font-semibold mb-4'>
              {isCommentReport ? '댓글 신고하기' : '다이어리 신고하기'}
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>신고 이유</label>
              <select
                className='w-full border border-gray-300 rounded-md p-2'
                value={reportType}
                onChange={e => setReportType(e.target.value as Report.Type)}
              >
                {Object.entries(Report.TypeLabel).map(([type, label]) => (
                  <option key={type} value={type}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                구체적인 신고 내용을 기재해주세요.
              </label>
              <textarea
                className='w-full border border-gray-300 rounded-md p-2 h-32 resize-none'
                placeholder='구체적인 신고 내용을 기재해주세요.'
                value={reportContent}
                onChange={e => setReportContent(e.target.value)}
              ></textarea>
            </div>

            <div className='flex justify-center'>
              <button
                onClick={handleSubmitReport}
                disabled={isActionLoading}
                className='bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition disabled:opacity-50 mr-2'
              >
                {isActionLoading ? '처리 중...' : '신고'}
              </button>
              <button
                onClick={handleCloseReportModal}
                className='border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-100 transition'
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
