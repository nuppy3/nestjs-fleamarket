/**
 * Region domain作成時に必要はプロパティを型として定義
 */
export interface RegionProps {
  code: string;
  name: string;
  kanaName: string;
  kanaEn: string;
  // statusなどはcreateNewの中で自動設定するのでここには含めない
  // status: RegionStatus;
  // createdAt: Date;
  // updatedAt: Date;
}

/**
 * Region domain
 */
export class Region {
  // domainを守るために、外部からNewさせない
  // 且つ、プロパティを定義をreadonlyにして更なる安全を確保
  private code: string;
  private name: string;
  private kanaName: string;
  private status: RegionStatus;
  private kanaEn: string;
  private createdAt: Date;
  private updatedAt: Date;

  // constructorを private にして外部からの new を禁止する
  private constructor(
    code: string,
    name: string,
    kanaName: string,
    status: RegionStatus,
    kanaEn: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.code = code;
    this.name = name;
    this.kanaName = kanaName;
    this.status = status;
    this.kanaEn = kanaEn;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * 新規作成用の静的メソッド（factory method）
   * domain新規作成時のルールを実装
   *  例：新規作成時のstatusは編集中
   *     createdAt,updatedAtはデフォルトでdomain作成時時刻
   *
   */
  static createNew(
    // 以下のpropsを使っているコード(domainをベースに不要項目をomit)、いいね！
    // props: Omit<Region, 'createdAt' | 'updatedAt'>,
    //
    // code: string,
    // name: string,
    // kanaName: string,
    // status: RegionStatus,
    // kanaEn: string,

    // → propsの項目（code,nameなど）をprivateにしたことでOmit<Region,...>の肩だとエラーになるため
    // 以下のようにRegionProps(interface)に切り替え（こちらばBP）
    props: RegionProps,
  ): Region {
    // createdAt,updatedAtはデフォルトでdomain作成時時刻
    // ステータスは強制的に「編集中」= EDITING
    return new Region(
      props.code,
      props.name,
      props.kanaName,
      // props.status,
      RegionStatus.EDITING,
      props.kanaEn,
      new Date(),
      new Date(),
    );
  }

  /**
   * domainの再構築（DB等からの再構築用（すでに日付がある場合））
   */
  static reconstitute(
    code: string,
    name: string,
    kanaName: string,
    status: RegionStatus,
    kanaEn: string,
    createdAt: Date,
    updatedAt: Date,
  ): Region {
    // createdAt,updatedAtはデフォルトでdomain作成時時刻
    return new Region(
      code,
      name,
      kanaName,
      status,
      kanaEn,
      createdAt,
      updatedAt,
    );
  }

  /**
   * domain delete(ソフトデリート)
   * ・status: 停止
   */
  remove() {
    this.status = 'suspended';
  }
}

export const RegionStatus = {
  PUBLISHED: 'published', // 掲載中
  EDITING: 'editing', // 編集中
  SUSPENDED: 'suspended', // 停止中
} as const;

// RegionStatus Type
export type RegionStatus = (typeof RegionStatus)[keyof typeof RegionStatus];
