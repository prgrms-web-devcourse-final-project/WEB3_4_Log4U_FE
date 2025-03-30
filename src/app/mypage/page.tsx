import SideBar from "@/ui/SideBar";
import Link from "next/link";
import Image from "next/image";

function MainContent() {
  return (
    <div className="justify-items-center content-center border-r border-l border-gray-300">
      <p>my page</p>
    </div>
  );
}

export function LeftSideBar() {
  return (
    <SideBar>
      <h1>log4U</h1>
      <div>
        <div className="flex items-center mb-2">
          <Image src="/home.png" alt="home image" width={50} height={50} />
          <Link href="/">
            <span className="text-text p-5 text-2xl font-bold">홈</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image src="/search.png" alt="search image" width={50} height={50} />
          <Link href="/search">
            <span className="text-text p-5 text-2xl font-bold">검색</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image
            src="/add-diary.png"
            alt="add diary image"
            width={50}
            height={50}
          />
          <Link href="/add-diary">
            <span className="text-text p-5 text-2xl font-bold">만들기</span>
          </Link>
        </div>
        <div className="flex items-center mb-2">
          <Image src="/mypage.png" alt="mypage image" width={50} height={50} />
          <Link href="/mypage">
            <span className="text-text p-5 text-2xl font-bold">마이페이지</span>
          </Link>
        </div>
      </div>
    </SideBar>
  );
}

export default function MyPage() {
  return (
    <div className="bg-neutral h-screen">
      <div className="bg-neutral h-full w-full grid grid-cols-[280px_1fr_280px] gap-4">
        <LeftSideBar></LeftSideBar>
        <MainContent></MainContent>
        <SideBar>
          <p>right sidebar</p>
        </SideBar>
      </div>
    </div>
  );
}
