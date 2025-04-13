export namespace User {
  export interface Me {
    userId: number;

    name: string;

    nickname: string;

    statusMessage: string;

    diaryCount: number;

    profileImage: string;

    followers: number;

    followings: number;
  }

  export interface IFollowSummary {
    userId: number;

    nickname: string;

    thumbNail: string;
  }
}
