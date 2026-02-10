/**
 * ページネーションされた情報
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    // 総件数
    totalCount: number;
    // ページ
    page: number;
    // 1ページあたりの件数
    size: number;
  };
}
