export namespace Pagination {
  export interface CursorMeta {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    nextCursor: number;
  }

  export interface ICursor<T> {
    list: T[];
    pageInfo: CursorMeta;
  }
}
