// app/diary/map/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MockUtil } from "@root/utils/mock.util";
import GoogleMapComponent from "@/app/googleMap";
import { User } from "@root/types/user";
import { Diary } from "@root/types/diary";

function MyDiaries(diaries: Diary.Detail[]) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-4">
      {diaries.length > 0
        ? diaries.slice(0, 9).map((diary) => (
            <Link
              href={`/diaries/${diary.diaryId}`}
              key={diary.diaryId}
              className="block border rounded-lg overflow-hidden hover:shadow-md transition"
            >
              <div className="h-40 bg-gray-200 relative">
                <img
                  src={diary.thumbnailUrl || "/api/placeholder/300/200"}
                  alt="다이어리 이미지"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 text-sm text-center text-gray-700">
                <div>다이어리 여행,</div>
                <div>
                  {diary.dongmyun}, {Diary.WeatherMap[diary.weatherInfo]}
                </div>
              </div>
            </Link>
          ))
        : // 다이어리가 없을 경우 빈 그리드 셀 9개 생성
          Array.from({ length: 9 }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="border rounded overflow-hidden aspect-square flex flex-col h-[250px]"
            >
              <div className="w-full flex-1 bg-gray-100"></div>
              <div className="p-2 text-center text-sm text-gray-300 h-16 flex flex-col justify-center">
                <p>다이어리 없음</p>
              </div>
            </div>
          ))}
    </div>
  );
}

export default function HomePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [diaries, setDiaries] = useState<Diary.Detail[]>([]);
  const [user, setUser] = useState<User.Me | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(8);

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 목 데이터 사용
        // @todo: users/me 불러오도록  변경 필요.

        const user = MockUtil.IUser.Me();
        setUser(user);
        setDiaries(user.list);
        setTotalPages(8);
      } catch (error) {
        console.error("데이터 로딩 중 오류 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  // 페이지 변경 처리
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 페이지네이션 렌더링
  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    // 이전 버튼
    pages.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 text-sm text-gray-600"
      >
        ◀ Previous
      </button>,
    );

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`w-8 h-8 mx-1 rounded-full ${
            i === currentPage ? "bg-gray-800 text-white" : "text-gray-600"
          }`}
        >
          {i}
        </button>,
      );
    }

    // 다음 버튼
    pages.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 text-sm text-gray-600"
      >
        Next ▶
      </button>,
    );

    return (
      <div className="flex items-center justify-center space-x-1 mt-4">
        {pages}
      </div>
    );
  };

  return (
    <div className="flex p-4">
      <div className="flex-1 flex flex-col overflow-auto">
        {/* 사용자 프로필 정보 */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="w-20 h-20 rounded-full border overflow-hidden mr-6">
              <img
                src={user?.profileImage}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold mb-2">winter</h1>
              <div className="flex space-x-4 text-sm">
                <div>게시물 {user?.diaryCount || 0}</div>
                <div>팔로워 {user?.followers || 0}</div>
                <div>팔로잉 {user?.followings || 0}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 다이어리 지도 제목 */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold">다이어리 지도 - 경로 시각화</h2>
        </div>

        {/* 구글 맵 */}
        <GoogleMapComponent
          markers={
            user?.list.map((diary) => ({
              id: diary.diaryId,
              lat: diary.latitude,
              lng: diary.longitude,
              title: diary.title,
              profileUrl: diary.thumbnailUrl,
            })) ?? []
          }
        ></GoogleMapComponent>

        {/* 공개된 다이어리 섹션 */}
        <div className="px-6 py-4">
          <h3 className="text-lg font-bold mb-4">공개된 다이어리</h3>

          {/* 다이어리 그리드 */}
          {MyDiaries(diaries)}

          {/* 페이지네이션 */}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
}
