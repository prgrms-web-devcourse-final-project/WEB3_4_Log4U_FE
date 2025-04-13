'use client';

export default function EmptyDiaryCard() {
  return (
    <div className='border border-dashed rounded-lg h-48 flex items-center justify-center'>
      <div className='text-center p-6'>
        <div className='text-4xl mb-2 text-gray-300'>+</div>
        <p className='text-gray-400'>새 다이어리 작성하기</p>
      </div>
    </div>
  );
}
