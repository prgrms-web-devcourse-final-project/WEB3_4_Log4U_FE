'use client';

import { useState, useRef, useEffect } from 'react';
import { Support } from '@root/types/support';
import { SupportService } from '@root/services/support';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [supportType, setSupportType] = useState<Support.Type>(Support.Type.TECHNICAL_ISSUE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달 리셋
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setContent('');
      setSupportType(Support.Type.TECHNICAL_ISSUE);
      setError(null);
    }
  }, [isOpen]);

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

  const handleSubmit = async () => {
    // 입력값 검증
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const supportData: Support.CreateDto = {
        supportType,
        title: title.trim(),
        content: content.trim(),
      };

      await SupportService.createSupport(supportData);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('문의 등록 실패:', error);
      setError('문의 등록 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-opacity-50 z-50 flex items-center justify-center'>
      <div
        ref={modalRef}
        className='rounded-lg w-full max-w-lg border-2 shadow-lg'
        style={{
          backgroundColor: 'var(--color-neutral)',
          borderColor: 'var(--color-primary)',
        }}
      >
        {/* 모달 헤더 */}
        <div
          className='border-b px-5 py-4 flex items-center justify-between'
          style={{ borderColor: 'var(--color-secondary)' }}
        >
          <h3 className='text-xl font-semibold' style={{ color: 'var(--color-primary)' }}>
            문의 등록하기
          </h3>
          <button
            onClick={onClose}
            style={{ color: 'var(--color-primary)' }}
            className='hover:opacity-75'
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

        {/* 문의 폼 */}
        <div className='p-5'>
          {error && (
            <div
              className='mb-4 p-3 rounded-md text-sm'
              style={{ backgroundColor: '#FDEDEC', color: 'var(--color-accent)' }}
            >
              {error}
            </div>
          )}

          {/* 문의 유형 */}
          <div className='mb-4'>
            <label className='block font-medium mb-2' style={{ color: 'var(--color-text)' }}>
              문의 유형
            </label>
            <select
              value={supportType}
              onChange={e => setSupportType(e.target.value as Support.Type)}
              className='w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2'
              style={
                {
                  borderColor: 'var(--color-secondary)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties
              }
            >
              {Object.values(Support.Type).map(value => (
                <option key={value} value={value}>
                  {Support.TypeMap[value]}
                </option>
              ))}
            </select>
          </div>

          {/* 제목 */}
          <div className='mb-4'>
            <label className='block font-medium mb-2' style={{ color: 'var(--color-text)' }}>
              제목
            </label>
            <input
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='문의 제목을 입력하세요'
              className='w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2'
              style={
                {
                  borderColor: 'var(--color-secondary)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties
              }
            />
          </div>

          {/* 내용 */}
          <div className='mb-4'>
            <label className='block font-medium mb-2' style={{ color: 'var(--color-text)' }}>
              내용
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder='구체적인 문의 내용을 기재해주세요.'
              rows={5}
              className='w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2'
              style={
                {
                  borderColor: 'var(--color-secondary)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  '--tw-ring-color': 'var(--color-primary)',
                } as React.CSSProperties
              }
            />
          </div>
        </div>

        {/* 모달 푸터 */}
        <div
          className='border-t px-5 py-3 flex justify-end space-x-2'
          style={{ borderColor: 'var(--color-secondary)' }}
        >
          <button
            onClick={onClose}
            className='px-4 py-2 rounded-md transition hover:opacity-80'
            style={{
              backgroundColor: 'var(--color-secondary)',
              color: 'var(--color-text)',
            }}
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-4 py-2 rounded-md transition hover:opacity-80 flex items-center'
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
            }}
          >
            {isSubmitting ? (
              <>
                <div className='animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full'></div>
                처리 중...
              </>
            ) : (
              '등록'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;
