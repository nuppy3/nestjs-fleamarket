import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Prefecture, PrefectureStatus } from '../prefectures.model';

/**
 * CreatePrefectureDto
 *
 * 【特記事項】tsconfig.jsonに「"strictPropertyInitialization": true,」を指定すると
 * オブジェクト(DTOなどのclass)の初期化を促すチェックが入る（constructorなどで初期化しないと
 * 必須項目であってもnullやundefinedがセットされ、xxxx.nameのようにプロパティにアクセスすると
 * エラーが発生する可能性あると判断される）
 *
 * 一般的には、constructoreを用意し、初期化すればいいのだが、リクエストパラメータを受け取る際の
 * DTOはNestJSが new するので、「!」 を使って「フレームワークに任せるぜ」と宣言するのがBP。
 *
 * strictPropertyInitialization は true のままにする。
 * DTO の必須プロパティには ! をつける。（例: name!: string;）
 * DTO の任意プロパティには ? をつける。（例: kanaName?: string;）
 * constructor は無しでOK！
 */
export class CreatePrefectureDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaName!: string;

  // PrefectureStatusは厳密なEnumではない（modern Enum=union)のだが@IsEnum()が効くみたい！
  @IsEnum(PrefectureStatus, {
    message: `StoreStatus must be one of: ${PrefectureStatus.PUBLISHED}, ${PrefectureStatus.SUSPENDED}`,
  })
  status!: PrefectureStatus;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  kanaEn!: string;

  // constructorは不要：上記の特記事項参照
  // constructor(
  //   name: string,
  //   code: string,
  //   kanaName: string,
  //   status: PrefectureStatus,
  //   kanaEn: string,
  // ) {
  //   this.name = name;
  //   this.code = code;
  //   this.kanaName = kanaName;
  //   this.status = status;
  //   this.kanaEn = kanaEn;
  // }
}

// -------------------------------------------------
// ResopnseDTO: 型安全なPrerectureドメインのサブセット
// -------------------------------------------------
export const PrefectureResponseKeys = [
  'name',
  'code',
  'kanaName',
  'status',
  'kanaEn',
] satisfies (keyof Prefecture)[];

export type PrefectureResponseShape = Pick<
  Prefecture,
  (typeof PrefectureResponseKeys)[number]
>;

/**
 * 都道府県情報レスポンスDTO
 * PrefectureドメインのサブセットDTO
 *
 * @Expose() をつけると、plainToInstance の変換対象になります。
 * 返却項目を明示（@Expose）
 * 不要な項目を除外（@Exclude）
 * 値の変換（@Transform）
 */
export class PrefectureResponseDto implements PrefectureResponseShape {
  // ドメインにidは不要。ResponseDtoにidを付与。→ベストプラクティス!!
  @Expose()
  readonly id!: string;

  @Expose()
  name!: string;

  @Expose()
  code!: string;

  @Expose()
  kanaName!: string;

  @Expose()
  status!: PrefectureStatus;

  @Expose()
  get statusLabel(): string {
    switch (this.status) {
      case PrefectureStatus.PUBLISHED:
        return '反映中';
      case PrefectureStatus.SUSPENDED:
        return '停止';
      default:
        return '';
    }
  }

  @Expose()
  kanaEn!: string;

  @Expose()
  storeCount?: number;

  // constructor不要:上記の特記事項参照
  // constructor(
  //   name: string,
  //   code: string,
  //   kanaName: string,
  //   status: PrefectureStatus,
  //   kanaEn: string,
  // ) {
  //   this.name = name;
  //   this.code = code;
  //   this.kanaName = kanaName;
  //   this.status = status;
  //   this.kanaEn = kanaEn;
  // }
}
