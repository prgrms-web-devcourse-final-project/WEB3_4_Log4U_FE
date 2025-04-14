export namespace User {
  export interface ICommon {
    userId: number;

    name: string;

    nickname: string;

    statusMessage: string;

    diaryCount: number;

    profileImage: string;

    followers: number;

    followings: number;
  }

  export interface Me extends ICommon {}

  export interface ISummary extends ICommon {}

  export interface IDetail extends ICommon {}

  export interface IFollowSummary {
    userId: number;

    nickname: string;

    thumbNail: string;
  }

  export class CreateProfileDto {
    nickname!: string;

    statusMessage!: string;

    profileImage!: string;
  }
}
