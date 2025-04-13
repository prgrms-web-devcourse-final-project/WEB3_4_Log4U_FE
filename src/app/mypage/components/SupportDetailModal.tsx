'use client';

import { Support } from '@root/types/support';

interface SupportDetailModalProps {
  support: Support.IDetail | null;
  onClose: () => void;
}

export default function SupportDetailModal({ support, onClose }: SupportDetailModalProps) {
  if (!support) return null;

  // answerContent와 answeredAt이 있는지 확인
  const hasAnswer = support.answerContent && support.answeredAt;

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center'>
      <div
        className='rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden border-2'
        style={{ backgroundColor: 'var(--color-neutral)', borderColor: 'var(--color-primary)' }}
      >
        {/* 모달 헤더 */}
        <div
          className='border-b px-5 py-4 flex items-center justify-between'
          style={{ borderColor: 'var(--color-secondary)' }}
        >
          <div>
            <h3 className='text-xl font-semibold' style={{ color: 'var(--color-primary)' }}>
              {support.title}
            </h3>
            <p className='text-sm mt-1' style={{ color: 'var(--color-text)' }}>
              {Support.TypeMap[support.supportType]} ·
              {new Date(support.createdAt).toLocaleDateString()}
            </p>
          </div>
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

        {/* 모달 본문 */}
        <div className='flex-1 overflow-y-auto p-5'>
          <div className='mb-6'>
            <h4 className='font-medium mb-2' style={{ color: 'var(--color-primary)' }}>
              문의 내용
            </h4>
            <div
              className='bg-white p-4 rounded-lg border'
              style={{ borderColor: 'var(--color-secondary)' }}
            >
              <p style={{ color: 'var(--color-text)' }}>{support.content}</p>
            </div>
          </div>

          {hasAnswer && (
            <div>
              <h4 className='font-medium mb-2' style={{ color: 'var(--color-primary)' }}>
                답변
              </h4>
              <div
                className='bg-white p-4 rounded-lg border'
                style={{ borderColor: 'var(--color-secondary)' }}
              >
                <p style={{ color: 'var(--color-text)' }}>{support.answerContent}</p>
                <div className='text-right mt-2 text-sm' style={{ color: 'var(--color-text)' }}>
                  답변 일시: {new Date(support.answeredAt).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div
          className='border-t px-5 py-3 flex justify-end'
          style={{ borderColor: 'var(--color-secondary)' }}
        >
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md transition hover:opacity-80'
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
