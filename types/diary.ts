import { Pagination } from './pagination';

export namespace Diary {
  export function isVisibility(value: string): value is Diary.Visibility {
    return Object.values(Diary.Visibility).includes(value as Diary.Visibility);
  }

  export function isWeatherType(value: string): value is Diary.WeatherType {
    return Object.values(Diary.WeatherType).includes(value as Diary.WeatherType);
  }
  export const WeatherType = {
    SUNNY: 'SUNNY',
    CLOUDY: 'CLOUDY',
    RAINY: 'RAINY',
    SNOWY: 'SNOWY',
  } as const;

  export const WeatherMap = {
    [WeatherType.SUNNY]: '☀️ 맑음',
    [WeatherType.CLOUDY]: '☁️ 흐림',
    [WeatherType.RAINY]: '🌧️ 비',
    [WeatherType.SNOWY]: '❄️ 눈',
  } as const;

  export type WeatherType = (typeof WeatherType)[keyof typeof WeatherType];
  export const Visibility = {
    PUBLIC: 'PUBLIC',
    PRIVATE: 'PRIVATE',
    FOLLOWER: 'FOLLOWER',
  } as const;

  export type Visibility = (typeof Visibility)[keyof typeof Visibility];
  export const SortType = {
    LATEST: 'LATEST',
    POPULAR: 'POPULAR',
  } as const;

  export type SortType = (typeof SortType)[keyof typeof SortType];

  export interface Location {
    latitude: number;

    longitude: number;

    sido: string;

    sigungu: string;

    eupmyeondong: string;
  }

  export interface DiaryMedia {
    mediaId: number;
    fileUrl: string;
    contentType: string;
    orderIndex: number;
  }

  export namespace DiaryMedia {
    export class MutateDto {
      mediaId!: number;
      originalName!: string;
      storedName!: string;
      contentType!: string;
      size!: number;
      url!: string;
      orderIndex!: number;
    }
  }

  export interface Common {
    diaryId: number;

    authorId: number;

    authorNickname: string;

    authorProfileImage: string;

    location: Location;

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

  export interface Detail extends Common {
    isLiked: boolean;
  }

  export interface Summary extends Common {}

  export interface IPopularSummary {
    diaryId: number;

    title: string;
  }

  export interface CreateDto {
    title: string;
    content: string;
    diaryDate: string;
    location: Location;
    weatherInfo: WeatherType;
    visibility: Visibility;
    mediaList: DiaryMedia.MutateDto[];
    hashtagList: string[];
    thumbnailUrl?: string;
  }

  export interface UpdateDto extends CreateDto {}

  export class GetListCursorDto {
    keyword?: string;

    sort?: SortType = SortType.LATEST;

    cursorId?: number;

    size?: number = Pagination.DEFAULT_SIZE;
  }
}
