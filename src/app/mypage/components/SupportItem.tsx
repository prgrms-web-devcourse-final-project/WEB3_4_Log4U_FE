'use client';

import { Support } from '@root/types/support';

interface SupportItemProps {
  support: Support.ISummary;
  onViewDetail: (supportId: number) => void;
}

export default function SupportItem({ support, onViewDetail }: SupportItemProps) {
  // 문의 유형에 따른 스타일 변경
  const getTypeStyle = () => {
    switch (support.supportType) {
      case Support.Type.TECHNICAL_ISSUE:
        return { color: '#3498DB' }; // 기술적 문제는 파란색
      case Support.Type.ACCOUNT_ISSUE:
        return { color: '#9B59B6' }; // 계정 문제는 보라색
      case Support.Type.FEATURE_REQUEST:
        return { color: '#2ECC71' }; // 기능 요청은 초록색
      case Support.Type.SECURITY_CONCERN:
        return { color: '#E74C3C' }; // 보안 문제는 빨간색
      default:
        return { color: 'var(--color-text)' };
    }
  };

  // 답변 상태에 따른 배지 생성
  const getStatusBadge = () => {
    if (support.answered) {
      return (
        <span
          className='inline-block px-2 py-1 text-xs rounded-full ml-2'
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          답변완료
        </span>
      );
    }
    return (
      <span
        className='inline-block px-2 py-1 text-xs rounded-full ml-2'
        style={{ backgroundColor: '#888', color: 'white' }}
      >
        대기중
      </span>
    );
  };

  return (
    <div
      onClick={() => onViewDetail(support.id)}
      className='border rounded-lg p-4 mb-4 hover:shadow-md transition-shadow cursor-pointer'
      style={{ borderColor: 'var(--color-secondary)', backgroundColor: 'var(--color-neutral)' }}
    >
      <div className='flex justify-between items-start'>
        <div className='flex-1'>
          <h4 className='font-medium text-lg' style={{ color: 'var(--color-primary)' }}>
            {support.title}
            {getStatusBadge()}
          </h4>
          <p className='text-sm mt-1' style={getTypeStyle()}>
            {Support.TypeMap[support.supportType]}
          </p>
        </div>
        <div className='text-sm' style={{ color: 'var(--color-text)' }}>
          {new Date(support.createdAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
