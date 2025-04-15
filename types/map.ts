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

      lat: number;

      lon: number;

      thumbnailUrl: string;

      likeCount: number;

      createdAt: string;
    }
  }

  export interface IGeolocation {
    status: IGeolocation.Status;

    results: IGeolocation.GeocodingResult[];
  }

  export namespace IGeolocation {
    // 상태 관련 인터페이스
    export interface Status {
      code: number;
      name: string;
      message: string;
    }

    // 좌표 관련 인터페이스
    export interface Coords {
      center: {
        crs: string;
        x: number;
        y: number;
      };
    }

    // 지역 정보 관련 인터페이스
    export interface Area {
      name: string;
      coords: Coords;
      alias: string | null;
    }

    // 지역 전체 정보 인터페이스
    export interface Region {
      area0: Area; // 국가
      area1: Area; // 시/도
      area2: Area; // 군/구
      area3: Area; // 동/읍/면
      area4: Area; // 리
    }

    // 코드 정보 인터페이스
    export interface Code {
      id: string;
      type: string;
      mappingId: string;
    }

    // 추가 정보 인터페이스
    export interface Addition {
      type: string;
      value: string;
    }

    // 토지 정보 인터페이스
    export interface Land {
      type: string;
      number1: string;
      number2: string;
      addition0: Addition;
      addition1: Addition;
      addition2: Addition;
      addition3: Addition;
      addition4: Addition;
      coords: Coords;
    }

    // 결과 항목 인터페이스
    export interface GeocodingResult {
      name: string; // legalcode, admcode, addr, roadaddr 등
      code: Code;
      region: Region;
      land: Land | null;
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
