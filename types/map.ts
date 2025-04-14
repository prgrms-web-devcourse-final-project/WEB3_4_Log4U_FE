export namespace Map {
  export interface ISummary {
    areaName: string;

    areaId: number;

    lat: number;

    lon: number;

    diaryCount: number;
  }

  export namespace IDiary {
    export interface IDetail {
      diaryId: number;

      title: string;

      latitude: number;

      longitude: number;

      thumbnailUrl: string;

      likeCount: number;

      createdAt: string;
    }
  }

  export class GetListQueryDto {
    south!: number;

    north!: number;

    west!: number;

    east!: number;

    zoom!: number;
  }
}
