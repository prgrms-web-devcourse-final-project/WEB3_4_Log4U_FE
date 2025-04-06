"use client";

import { FC } from "react";

type SSOProviderType = "naver" | "kakao" | "google";

function SSOAuth(provider: "naver" | "kakao" | "google") {
  return `/oauth2/authorization/${provider}`;
}

const LoginPage: FC = () => {
  const handleSocialLogin = async (provider: SSOProviderType) => {
    // 실제 소셜 로그인 로직 구현
    window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}${SSOAuth(provider)}`;

    alert(`${provider} 소셜 로그인`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f3eb]">
      <div className="max-w-sm w-full bg-white shadow-md rounded p-6">
        {/* 로고 영역 */}
        <h1 className="text-2xl font-bold text-center mb-6">log4U</h1>

        {/* 소셜 로그인 버튼들 */}
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => handleSocialLogin("naver")}
            className="bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700"
          >
            네이버로 로그인
          </button>
          <button
            onClick={() => handleSocialLogin("kakao")}
            className="bg-yellow-400 text-black py-2 rounded font-medium hover:bg-yellow-500"
          >
            카카오로 로그인
          </button>
          <button
            onClick={() => handleSocialLogin("google")}
            className="bg-white border border-gray-300 py-2 rounded font-medium hover:bg-gray-100"
          >
            구글로 로그인
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
