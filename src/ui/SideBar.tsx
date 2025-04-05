"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

interface SideBarProps {
  children: React.ReactNode;
}

export default function SideBar({ children }: SideBarProps): React.JSX.Element {
  return (
    <aside className="bg-neutral flex flex-col justify-center items-center border-l border-r border-gray-300">
      {children}
    </aside>
  );
}

export function LeftSideBar() {
  return (
    <SideBar>
      <h1 className="grow-1 text-4xl">log4U</h1>
      <div className="grow-2">
        <div className="flex items-center mb-2">
          <Image src="/home.png" alt="home image" width={50} height={50} />
          <Link href="/">
            <span className="p-5 text-2xl font-bold">홈</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image src="/search.png" alt="search image" width={50} height={50} />
          <Link href="/search">
            <span className="p-5 text-2xl font-bold">검색</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image
            src="/add-diary.png"
            alt="add diary image"
            width={50}
            height={50}
          />
          <Link href="/diaries/new">
            <span className="p-5 text-2xl font-bold">만들기</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image src="/mypage.png" alt="mypage image" width={50} height={50} />
          <Link href="/mypage">
            <span className="p-5 text-2xl font-bold">마이페이지</span>
          </Link>
        </div>
      </div>
    </SideBar>
  );
}
export function RightSideBar() {
  const hotUsers = [
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
    "winter",
  ];
  return (
    <SideBar>
      <div className="grow-1">
        <div className="flex items-center">
          <Image
            src={"/test-profile.png"}
            alt={"profile image"}
            width={50}
            height={50}
          />
          <span className="p-5 text-2xl font-bold">test user</span>
        </div>
        <div>
          <div className="flex items-center">
            <Image
              src={"/sun.png"}
              alt={"weather image"}
              width={50}
              height={50}
            />
            <span className="p-5 text-2xl font-bold">6°C</span>
          </div>
          <div>서울특별시 강남구</div>
        </div>
      </div>
      <div className="grow-2">
        <div className="flex items-center">
          <Image
            src="/hot-logger.png"
            alt="hot logger image"
            width={50}
            height={50}
          />
          <span className={"p-5 text-xl font-bold"}>인기 로거</span>
        </div>
        {hotUsers.map((member, index) => (
          <div key={index} className="pl-4">
            {index + 1}. {member}
          </div>
        ))}
      </div>
    </SideBar>
  );
}
