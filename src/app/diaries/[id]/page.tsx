import { FC } from "react";
import Image from "next/image";

const InstagramPost: FC = () => {
  return (
    <div className="mx-auto my-8 max-w-screen-lg border border-gray-300 bg-white flex rounded-md overflow-hidden">
      {/* 왼쪽 이미지 영역 */}
      <div className="relative w-2/3 h-auto">
        <Image
          src="/family.jpeg" // public 폴더 내 이미지 파일 (경로는 필요에 따라 수정)
          alt="Family"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* 오른쪽 게시물 정보 영역 */}
      <div className="w-1/3 flex flex-col">
        {/* 프로필 정보 (상단) */}
        <div className="px-4 py-3 flex items-center border-b border-gray-200">
          <div className="w-8 h-8 rounded-full bg-gray-300 mr-3">
            <Image
              src={"/test-profile.png"}
              alt={"profile image"}
              width={32}
              height={32}
            />
          </div>

          <div>
            <div className="font-semibold">winter</div>
            <div className="text-sm text-gray-500">Seoul, Korea</div>
          </div>
        </div>

        {/* 게시물 본문 내용 */}
        <div className="px-4 py-4 border-b border-gray-200">
          <p className="text-sm text-gray-800 leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>

        {/* 좋아요/댓글 목록 영역 */}
        <div className="px-4 py-4 flex-1 flex flex-col overflow-auto">
          <ul className="space-y-3">
            {["ppaike", "mipark", "leesom", "rosy", "mark", "cr7", "dzew"].map(
              (user, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {/* 프로필 아이콘 placeholder */}
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3" />
                    <span className="font-semibold text-sm">{user}</span>
                  </div>
                  <span className="text-gray-600 text-sm">good</span>
                </li>
              ),
            )}
          </ul>
          <div className="ml-4 flex space-x-2">
            <button className="text-blue-500 hover:text-blue-600">
              <Image
                src={"/like.png"}
                alt={"like image"}
                width={20}
                height={20}
              />
            </button>
            <button className="text-blue-500 hover:text-blue-600">
              <Image
                src={"/comment.png"}
                alt={"comment image"}
                width={20}
                height={20}
              />
            </button>
            <button className="text-blue-500 hover:text-blue-600">
              <Image
                src={"/report.png"}
                alt={"report image"}
                width={20}
                height={20}
              />
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm font-medium">좋아요 162,982개</div>
        {/* 댓글 입력 및 버튼 영역 */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center">
          <input
            type="text"
            placeholder="댓글 달기..."
            className="flex-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default InstagramPost;
