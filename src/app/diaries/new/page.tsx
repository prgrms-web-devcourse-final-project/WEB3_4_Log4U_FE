// pages/diaryCreate.tsx

import { FC } from "react";

const DiaryCreatePage: FC = () => {
  return (
    <div className="max-w-md mx-auto my-8 border border-gray-300 rounded p-4 bg-white">
      {/* 상단 날짜 (중앙 정렬) */}
      <div className="text-center text-lg font-semibold mb-6">2025.03.23</div>

      {/* 날씨 & 시간 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center">
          <span className="mr-1">날씨</span>
          <span>☀️</span>
          {/* 드롭다운 화살표 아이콘 대신 임시로 텍스트 사용 */}
          <span className="ml-1 text-gray-400">▼</span>
        </div>
        <div className="text-right">
          시간 <span className="ml-1">오후 06:00</span>
          <span className="ml-1 text-gray-400">▼</span>
        </div>
      </div>

      {/* 위치 & 태그 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          위치 <span className="ml-1">서울특별시 강남구</span>
          <span className="ml-1 text-gray-400">▼</span>
        </div>
        <div className="text-right">
          태그 <span className="ml-1">#일상 #추억</span>
          <span className="ml-1 text-gray-400">▼</span>
        </div>
      </div>

      {/* 공개대상 */}
      <div className="mb-6">
        공개대상 <span className="ml-1">전체</span>
        <span className="ml-1 text-gray-400">▼</span>
      </div>

      {/* 제목 입력 */}
      <div className="mb-2 font-medium">제목</div>
      <input
        type="text"
        placeholder="제목"
        className="w-full border border-gray-300 rounded p-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* 작성 영역 */}
      <div className="mb-2 font-medium">작성</div>
      <textarea
        placeholder="작성..."
        className="w-full border border-gray-300 rounded p-2 mb-6 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* 하단 버튼 영역 */}
      <div className="flex justify-between">
        <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100 text-sm">
          파일 첨부
        </button>
        <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
          작성
        </button>
      </div>
    </div>
  );
};

export default DiaryCreatePage;
