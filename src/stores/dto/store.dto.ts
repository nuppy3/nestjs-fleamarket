import { Expose, Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  StoreStatus,
  WEEKDAY_LABELS,
  WEEKDAYS,
  type Weekday,
} from '../stores.model';

export class CreateStoreDto {
  // idはリクエストパラメーターで取得しない
  // id: number;
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name: string;

  @IsOptional() // 任意項目デコレーター(渡された値がnullの場合は、以降のIsString、MaxLengthなどを無視する)
  @IsString() // 任意項目だが入力された際のValidation
  @MaxLength(40) // 任意項目だが入力された際のValidation
  kanaName?: string;

  @IsEnum(StoreStatus, {
    message: `StoreStatus must be one of: ${StoreStatus.EDITING}, ${StoreStatus.PUBLISHED}, ${StoreStatus.SUSPENDED}`,
  })
  status: StoreStatus;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  zipCode?: string; // 郵便番号

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  prefecture?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(13)
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessHours?: string; // 営業時間 例："10:00〜20:00"

  @IsOptional()
  @IsArray()
  @ArrayUnique() // 重複禁止
  @IsIn(WEEKDAYS, {
    // union型のチェック。enumは別のdecoretor
    each: true, // 各要素がWEEKDAYS内の文字列であることをチェック
    message: `holiday must be one of: ${WEEKDAYS.join(', ')}`,
  })
  holidays?: Weekday[]; // 休日は複数の曜日なので配列型
}

/**
 * 店舗情報レスポンスDTO
 *
 * @Expose() をつけると、plainToInstance の変換対象になります。
 * 返却項目を明示（@Expose）
 * 不要な項目を除外（@Exclude）
 * 値の変換（@Transform）
 */
export class StoreResponseDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  kanaName?: string;

  @Expose()
  status: StoreStatus;
  // ステータスを日本語に変換（@Transformではなくgetterで）
  @Expose()
  get statusLabel(): string {
    switch (this.status) {
      case StoreStatus.PUBLISHED:
        return '営業中';
      case StoreStatus.EDITING:
        return '編集中';
      case StoreStatus.SUSPENDED:
        return '閉店';
      default:
        return '';
    }
  }

  @Expose()
  zipCode?: string;
  @Expose()
  email: string;
  @Expose()
  address?: string;
  @Expose()
  prefecture?: string;
  @Expose()
  phoneNumber: string;
  @Expose()
  businessHours?: string;

  // 休日
  @Expose()
  holidays?: Weekday[];

  // 休日を日本語['月', '火', ...] の形式で返す
  @Expose()
  @Transform(({ value }) => (value as Weekday[])?.map((w) => WEEKDAY_LABELS[w]))
  holidaysLabel?: string[];
}
