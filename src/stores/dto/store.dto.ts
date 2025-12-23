import { Expose } from 'class-transformer';
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
import { type Prefecture } from '../../prefectures/prefectures.model';
import {
    Store,
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

  // StoreStatusは厳密なEnumではない（modern Enum=union)のだが@IsEnum()が効くみたい！
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
  @MaxLength(2)
  prefectureCode?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(13)
  phoneNumber: string;

  @IsOptional()
  @IsNotEmpty()
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

// ------------------------------------
// 型安全なサブセット(全体の一部）DTOの抽出)
// ------------------------------------
// StoreドメインをベースとしたKeySet
export const StoreResponseKeys = [
  // Storeドメイン（Entity)にid(uuid)は持たせない。
  // 'id',
  'name',
  'kanaName',
  'status',
  'zipCode',
  'email',
  'address',
  'phoneNumber',
  'businessHours',
  'holidays',
  'prefecture',
  // satisfiesは配列が(keyof Store)[]型に一致するか確認
  // 要するに、配列内の各要素がStore型のkeyのみであることを強制
] satisfies (keyof Store)[];

// 型安全なStoreのサブセット(全体の一部）DTOを作成
// Storeの中から上記要素(キー名)だけをPick
export type StoreResponseShape = Pick<
  Store,
  (typeof StoreResponseKeys)[number]
>;

/**
 * 店舗情報レスポンスDTO
 * StoreドメインのサブセットDTO
 *
 * @Expose() をつけると、plainToInstance の変換対象になります。
 * 返却項目を明示（@Expose）
 * 不要な項目を除外（@Exclude）
 * 値の変換（@Transform）
 */
export class StoreResponseDto implements StoreResponseShape {
  // Storeドメインにidは不要。ResponseDtoにidを付与。→ベストプラクティス!!
  @Expose()
  readonly id: string;

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
  phoneNumber: string;
  @Expose()
  businessHours?: string;

  // 休日
  @Expose()
  holidays?: Weekday[];

  // ※ @Transformよりも以下のgetterの方がスマートらしいので削除
  // 休日を日本語['月', '火', ...] の形式で返す。
  // @Expose()
  // @Transform(({ value }) => (value as Weekday[])?.map((w) => WEEKDAY_LABELS[w]))
  // holidaysLabel?: string[];

  /**
   * 休日を日本語['日', '月', ...] の形式で返すゲッター
   * 変換ロジックをゲッター内に持つことで、instanceToPlain時に実行される。
   */
  @Expose() // JSONに出力するため、ゲッターにも @Expose() が必要
  get holidaysLabel(): string[] | undefined {
    // // holidaysプロパティが既に plainToInstance によって設定されていることを前提とする
    // if (!this.holidays || this.holidays.length === 0) {
    //   return undefined; // 値がない場合は undefined を返す
    // }

    // WEEKDAY_LABELS を使用して変換を実行
    return this.holidays?.map((w) => WEEKDAY_LABELS[w]);
  }

  @Expose()
  readonly createdAt: Date;
  @Expose()
  readonly updatedAt: Date;

  @Expose()
  readonly prefecture?: Prefecture;

  // 重要!! コンストラクタ：domain → DTO 変換するコンストラクタ
  // domainはあくまで「ビジネスルール」だけ持つべきであり、idやcreatedAt、updatedAtなどはDTO
  // で持つ。
  // あれ??、でもplainToInstanceでdomain→dto変換してるから、このconstructor使われてなくね？
  constructor(domain: Store, id: string) {
    this.id = id;
    Object.assign(this, domain);
  }
}
