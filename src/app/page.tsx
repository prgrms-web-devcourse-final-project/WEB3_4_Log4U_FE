import Image from "next/image";
import GoogleMapComponent from "@/app/googleMap";
import { Pagination } from "@/ui/pagination";
import Link from "next/link";
import React from "react";

const diaries = [
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
  {
    thumbnailUrl: "/diary-thumbnail-test.png",
    name: "mydiary",
    likeCount: 222,
    authorName: "winter",
  },
];

function Profile() {
  return (
    <div className="flex item-center my-15 grow-1">
      <Image
        src={"/test-profile.png"}
        alt={"profile-image"}
        width={100}
        height={100}
      />
      <div className={"ml-4 flex flex-col justify-center"}>
        <p className="text-2xl">{"winter"}</p>
        <div className="flex">
          <span className={"grow-2 pr-3"}>게시물 {167}</span>
          <span className={"grow-2 pr-3"}>팔로워 {167}</span>
          <span className={"grow-2 pr-3"}>팔로잉 {167}</span>
          <button
            className={"grow-3 bg-primary text-white text-xs rounded-xl w-40"}
          >
            {true ? "팔로우" : "언팔로우"}
          </button>
        </div>
        <p className={"text-xs"}>{"여행 좋아하는 윈터"}</p>
      </div>
    </div>
  );
}

function Diaries() {
  return (
    <div className="grow-1">
      <div className="grid grid-cols-3 grid-rows-3 gap-4">
        {diaries.map((diary, index) => (
          <div key={index} className="">
            <Link href={"/diary/1?modal=true"} shallow>
              <Image
                src={diary.thumbnailUrl}
                alt={"diary-thumbnail"}
                width={100}
                height={100}
              />
              <div className="flex justify-between">
                <span>{diary.name}</span>
                <span>{diary.likeCount}</span>
              </div>
              <span>{diary.authorName}</span>
            </Link>
          </div>
        ))}
      </div>
      <Pagination></Pagination>
    </div>
  );
}

export function MainContent() {
  return (
    <div className="max-w-[700px] mx-[280px] flex flex-col justify-items-center content-start">
      <Profile></Profile>
      <GoogleMapComponent
        markers={[
          {
            id: 1,
            lat: 37.5665,
            lng: 126.978,
            profileUrl: "/api/placeholder/60/60",
            count: 9,
          },
        ]}
      />{" "}
      <Diaries></Diaries>
    </div>
  );
}

export default function Home() {
  return <MainContent></MainContent>;
}
