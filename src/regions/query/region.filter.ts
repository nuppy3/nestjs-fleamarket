/**
 * エリア一覧取得（findAll service)で使用するフィルタ条件
 *
 * @example
 * ```ts
 * // ステータスが編集中のエリアのみ取得
 * await this.regionsQueryService.findAll({ status: 'editing' });
 *
 * // 全エリア取得（フィルタなし）
 * await this.regionsQueryService.findAll();
 * ```
 */
export type RegionFilter = {
  // エリアコード
  // 本来、codeでフィルタは不要（findByCode()を使うべき）
  code?: string;

  // エリア名
  name?: string;
};
