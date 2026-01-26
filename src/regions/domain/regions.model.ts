export class Region {
  // domainを守るために、外部からNewさせない
  // 且つ、プロパティを定義をreadonlyにして更なる安全を確保
  readonly code: string;
  readonly name: string;
  readonly kanaName: string;
  readonly status: RegionStatus;
  readonly kanaEn: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

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

  // 新規作成用の静的メソッド（factory method）
  static createNew(
    code: string,
    name: string,
    kanaName: string,
    status: RegionStatus,
    kanaEn: string,
  ): Region {
    // createdAt,updatedAtはデフォルトでdomain作成時時刻
    return new Region(
      code,
      name,
      kanaName,
      status,
      kanaEn,
      new Date(),
      new Date(),
    );
  }
}

export const RegionStatus = {
  PUBLISHED: 'published', // 掲載中
  SUSPENDED: 'suspended', // 停止中
} as const;

// RegionStatus Type
export type RegionStatus = (typeof RegionStatus)[keyof typeof RegionStatus];
