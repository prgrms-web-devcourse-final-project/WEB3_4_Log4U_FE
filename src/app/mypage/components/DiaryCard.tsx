'use client';

import Link from 'next/link';
import { Diary } from '@root/types/diary';

interface DiaryCardProps {
  diary: Diary.Summary;
}

export default function DiaryCard({ diary }: DiaryCardProps) {
  return (
    <Link
      href={`/diaries/${diary.diaryId}`}
      scroll={false}
      className='block border rounded-lg overflow-hidden hover:shadow-lg transition group'
    >
      <div className='h-48 bg-gray-200 relative overflow-hidden'>
        {diary.thumbnailUrl ? (
          <img
            src={diary.thumbnailUrl}
            alt='다이어리 이미지'
            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
          />
        ) : (
          <img
            src='/diary-thumbnail-test.png'
            alt='기본 다이어리 이미지'
            className='w-full h-full object-cover group-hover:scale-105 transition duration-300'
          />
        )}
        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300'></div>
      </div>
      <div className='p-4'>
        <h3 className='font-semibold mb-1 truncate'>{diary.title}</h3>
        <div className='flex text-sm text-gray-600 justify-between'>
          <span>{Diary.WeatherMap[diary.weatherInfo]}</span>
          <span>{new Date(diary.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </Link>
  );
}
