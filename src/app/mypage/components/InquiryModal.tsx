'use client';

import { useState, useRef, useEffect } from 'react';
import { Support } from '@root/types/support';
import { SupportService } from '@root/services/support';

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ isOpen, onClose, onSuccess }) => {
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
        className='bg-white rounded-lg w-full max-w-lg border-2 border-black shadow-lg'
      >
        {/* 모달 헤더 */}
        <div className='border-b px-5 py-4 flex items-center justify-between'>
          <h3 className='text-xl font-semibold'>문의 등록하기</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
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
            <div className='mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm'>{error}</div>
          )}

          {/* 문의 유형 */}
          <div className='mb-4'>
            <label className='block text-gray-700 font-medium mb-2'>문의 유형</label>
            <select
              value={supportType}
              onChange={e => setSupportType(e.target.value as Support.Type)}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
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
            <label className='block text-gray-700 font-medium mb-2'>제목</label>
            <input
              type='text'
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder='문의 제목을 입력하세요'
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>

          {/* 내용 */}
          <div className='mb-4'>
            <label className='block text-gray-700 font-medium mb-2'>내용</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder='구체적인 문의 내용을 기재해주세요.'
              rows={5}
              className='w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500'
            />
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className='border-t px-5 py-3 flex justify-end space-x-2'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition'
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center'
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

export default InquiryModal;
