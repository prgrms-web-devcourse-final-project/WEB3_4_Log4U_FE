import { LeftSideBar, RightSideBar } from "@/app/mypage/page";

export default function Home() {
  return (
    <div className="h-screen text-text">
      <div className="h-full w-full grid grid-cols-[280px_1fr_280px] gap-4">
        <LeftSideBar></LeftSideBar>
        <div className="justify-items-center content-center border-r border-l border-gray-300">
          <p>home page</p>
        </div>
        <RightSideBar></RightSideBar>
      </div>
    </div>
  );
}
