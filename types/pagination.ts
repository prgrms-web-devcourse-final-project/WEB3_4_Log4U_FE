export namespace Pagination {
  export const DEFAULT_SIZE = 9;

  export interface OffsetMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
  }

  export interface CursorMeta {
    size: number;
    totalElements: number;
    hasNext: boolean;
    nextCursor: number;
  }

  export interface ICursor<T> {
    list: T[];
    pageInfo: CursorMeta;
  }

  export interface IOffSet<T> {
    list: T[];
    pageInfo: OffsetMeta;
  }

  export interface CursorDto {
    cursorId?: number;
    size?: number;
  }
}
