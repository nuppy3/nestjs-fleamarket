/**
 * エリア一覧取得（findAll service)で使用するフィルタ条件
 *
 * @example
 * ```ts
 * // ステータスが編集中のエリアんみ取得
 * await this.regionsQueryService.findAll({ status: 'editing' });
 *
 * // 全店舗取得（フィルタなし）
 * await this.regionsQueryService.findAll();
 * ```
 */
export type RegionFilter = {
  // 本来、codeでフィルタは不要（findByCode()を使うべき）
  code: string;
};
