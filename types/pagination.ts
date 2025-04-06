export namespace Pagination {
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
    nextCursor: string;
  }

  export interface ICursor<T> {
    list: T[];
    pageInfo: CursorMeta;
  }
}
