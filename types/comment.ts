export namespace Comment {
  export interface Summary {
    commentId: number;

    content: string;

    createdAt: string;

    author: {
      userId: number;

      nickname: string;

      thumbnailUrl: string;
    };
  }

  export class Detail {}
}
