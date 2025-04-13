'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Diary } from '@root/types/diary';
import { User } from '@root/types/user';
import { DiaryService } from '@root/services/diary';
import { UserService } from '@root/services/user';
import DiaryModal from './diary.modal';

export default function DiaryPage() {
  const params = useParams<{
    diaryId: string;
  }>();
  const { diaryId } = params;

  const [diary, setDiary] = useState<Diary.Detail | null>(null);
  const [user, setUser] = useState<User.Me | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAuthor, setIsAuthor] = useState<boolean>(false);

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

        setIsAuthor(diaryData?.userId === userData?.userId);
      } catch (error) {
        console.error('다이어리 로딩 중 오류 발생:', error);
        setError('다이어리를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiary();
  }, [diaryId]);

  // 컴포넌트가 렌더링되기 전에 isLoading이 true일 때 처리
  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  // 에러 처리
  if (error) {
    return (
      <div className='flex justify-center items-center min-h-screen'>
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md'>
          <p>{error}</p>
          <button
            onClick={() => window.history.back()}
            className='mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition'
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 다이어리가 없을 때 처리
  if (!diary) {
    return notFound();
  }

  return (
    <DiaryModal
      diary={diary}
      user={user}
      diaryId={diaryId}
      isAuthor={isAuthor}
      onClose={() => window.history.back()}
    />
  );
}
