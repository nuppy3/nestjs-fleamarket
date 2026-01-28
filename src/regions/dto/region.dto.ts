import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PrefectureStatus } from '../../prefectures/prefectures.model';
import { Region, RegionStatus } from '../domain/regions.model';

export class CreateRegionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaName: string;

  // PrefectureStatusは厳密なEnumではない（modern Enum=union)のだが@IsEnum()が効くみたい！
  @IsEnum(RegionStatus, {
    message: `StoreStatus must be one of: ${RegionStatus.PUBLISHED}, ${RegionStatus.SUSPENDED}`,
  })
  status: RegionStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaEn: string;

  constructor(
    name: string,
    code: string,
    kanaName: string,
    status: RegionStatus,
    kanaEn: string,
  ) {
    this.name = name;
    this.code = code;
    this.kanaName = kanaName;
    this.status = status;
    this.kanaEn = kanaEn;
  }
}

// -------------------------------------------------
// ResopnseDTO: 型安全なRegionドメインのサブセット
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

  constructor(
    id: string,
    name: string,
    code: string,
    kanaName: string,
    status: RegionStatus,
    kanaEn: string,
  ) {
    this.id = id;
    this.name = name;
    this.code = code;
    this.kanaName = kanaName;
    this.status = status;
    this.kanaEn = kanaEn;
  }
}
