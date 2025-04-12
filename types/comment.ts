export namespace Comment {
  export interface Summary {
    commentId: number;

    content: string;

    author?: {
      userId: number;

      nickname: string;

      thumbnailUrl: string;
    };
  }

  export interface Detail {}

  export class CreateDto {
    diaryId!: number;

    content!: string;
  }

  export class GetListCursorDto {
    cursorCommentId?: number;

    size!: number;
  }
}
