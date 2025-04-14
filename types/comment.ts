export namespace Comment {
  export interface Summary {
    commentId: number;

    content: string;

    userId: number;

    userName: string;

    userProfileImage: string;

    createdAt: string;
  }

  export interface Detail extends Summary {}

  export class CreateDto {
    diaryId!: number;

    content!: string;
  }

  export class GetListCursorDto {
    cursorCommentId?: number;

    size!: number;
  }
}
