/**
 * ページネーションされた情報
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    // 総件数
    totalCount: number;
    // 1ページあたりの件数
    limit?: number;
    // 開始位置
    offset?: number;
  };
}
