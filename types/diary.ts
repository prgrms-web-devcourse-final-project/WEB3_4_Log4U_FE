export namespace Diary {
  export function isVisibility(value: string): value is Diary.Visibility {
    return Object.values(Diary.Visibility).includes(value as Diary.Visibility);
  }

  export function isWeatherType(value: string): value is Diary.WeatherType {
    return Object.values(Diary.WeatherType).includes(
      value as Diary.WeatherType,
    );
  }

  export const WeatherType = {
    SUNNY: "SUNNY",
    CLOUDY: "CLOUDY",
    RAINY: "RAINY",
    SNOWY: "SNOWY",
  } as const;
  export type WeatherType = (typeof WeatherType)[keyof typeof WeatherType];

  export const Visibility = {
    PUBLIC: "PUBLIC",
    PRIVATE: "PRIVATE",
    FOLLOWER: "FOLLOWER",
  } as const;
  export type Visibility = (typeof Visibility)[keyof typeof Visibility];

  export interface DiaryMedia {
    mediaId: number; // Long

    originalName: string; // String

    contentType: string; // String

    size: number; // Long

    url: string; // String

    orderIndex: number; // Integer
  }

  export interface Detail {
    diaryId: number;

    userId: number;

    latitude: number;

    longitude: number;

    title: string;

    content: string;

    weatherInfo: WeatherType;

    visibility: Visibility;

    createdAt: string;

    updatedAt: string;

    thumbnailUrl: string;

    likeCount: number;

    mediaList: DiaryMedia[];
  }

  export interface CreateDto
    extends Pick<
      Diary.Detail,
      | "latitude"
      | "longitude"
      | "title"
      | "content"
      | "weatherInfo"
      | "visibility"
      | "thumbnailUrl"
      | "mediaList"
    > {}

  export interface UpdateDto extends CreateDto {}

  export interface Summary {}
}
