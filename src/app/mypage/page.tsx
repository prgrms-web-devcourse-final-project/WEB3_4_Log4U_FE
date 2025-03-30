import { LeftSideBar, RightSideBar } from "@/ui/SideBar";

function MainContent() {
  return (
    <div className="justify-items-center content-center border-r border-l border-gray-300">
      <p>my page</p>
    </div>
  );
}

export default function MyPage() {
  return (
    <div className="bg-neutral h-screen text-text">
      <div className="bg-neutral h-full w-full grid grid-cols-[280px_1fr_280px] gap-4">
        <LeftSideBar></LeftSideBar>
        <MainContent></MainContent>
        <RightSideBar></RightSideBar>
      </div>
    </div>
  );
}
