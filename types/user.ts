import { Diary } from "@root/types/diary";
import { Pagination } from "@root/types/pagination";

export namespace User {
  export interface Me extends Pagination.IOffSet<Diary.Detail> {
    userId: number;

    name: string;

    nickname: string;

    statusMessage: string;

    diaryCount: number;

    profileImage: string;

    followers: number;

    followings: number;
  }
}
