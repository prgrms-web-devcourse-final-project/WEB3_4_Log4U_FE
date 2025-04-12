export namespace Like {
  export interface Summary {
    liked: boolean;

    likeCount: number;
  }

  export interface Detail extends Summary {}

  export class CreateDto {
    diaryId!: number;
  }
}
