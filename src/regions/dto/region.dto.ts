// -------------------------------------------------
// ResopnseDTO: 型安全なRegionドメインのサブセット

import { Expose } from 'class-transformer';
import { PrefectureStatus } from '../../prefectures/prefectures.model';
import { Region, RegionStatus } from '../regions.model';

// -------------------------------------------------
export const RegionResponseKeys = [
  'name',
  'code',
  'kanaName',
  'kanaEn',
  'status',
] satisfies (keyof Region)[];

export type RegionResponseShape = Pick<
  Region,
  (typeof RegionResponseKeys)[number]
>;

/**
 * エリア情報レスポンスDTO
 * RegionドメインのサブセットDTO
 *
 * @Expose() をつけると、plainToInstance の変換対象になります。
 * 返却項目を明示（@Expose）
 * 不要な項目を除外（@Exclude）
 * 値の変換（@Transform）
 */
export class RegionResponseDto implements RegionResponseShape {
  // ドメインにidは不要。ResponseDtoにidを付与。→ベストプラクティス!!
  @Expose()
  readonly id: string;

  @Expose()
  name: string;

  @Expose()
  code: string;

  @Expose()
  kanaName: string;

  @Expose()
  status: PrefectureStatus;

  @Expose()
  get statusLabel(): string {
    switch (this.status) {
      case RegionStatus.PUBLISHED:
        return '反映中';
      case RegionStatus.SUSPENDED:
        return '停止';
      default:
        return '';
    }
  }

  @Expose()
  kanaEn: string;

  @Expose()
  prefectureCount?: number;
}
