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
  private _code: string;
  private _name: string;
  private _kanaName: string;
  private _status: RegionStatus;
  private _kanaEn: string;
  private _createdAt: Date;
  private _updatedAt: Date;

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
    this._code = code;
    this._name = name;
    this._kanaName = kanaName;
    this._status = status;
    this._kanaEn = kanaEn;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
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
   * デリートロジックを集約（serviceなどに漏らさない)
   *
   * ・デリートしてもいいかの判定
   *  例：
   *  - すでに利用停止状態の場合は削除しない(エラーを投げる）
   *  - 紐づく都道府県が存在する場合は削除しない
   * ・ソフトデリート（＝status: 停止/ updateAtの更新)
   */
  remove() {
    // 既に停止中の場合
    if (this._status === RegionStatus.SUSPENDED) {
      throw new Error(`この地域はすでに利用停止状態です。地域： ${this._name}`);
    }

    this._status = RegionStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  // Getterを定義
  /**
   * Getter
   * コンストラクタの引数名（内部変数名）に'_'(アンダースコア)をつけて手を加え、
   * 外部に見せる名前（Getter）を綺麗な 変数名（code、name、、） に保つのが一般的。
   *
   * なぜ _（アンダースコア）がよく使われるのか？
   * 多くのエンジニアが private readonly _code: string と書く理由は、
   * **「外部に公開するプロパティ名（Getter名）を、一番自然な code という名前にしたいから」**です。
   * 内部: _code（ちょっと汚くてもいい、隠れているから）
   * 公開: code（利用者が使いやすい、綺麗な名前）
   */
  get code(): string {
    return this._code;
  }
  get name(): string {
    return this._name;
  }
  get kanaName(): string {
    return this._kanaName;
  }
  get status(): RegionStatus {
    return this._status;
  }
  get kanaEn(): string {
    return this._kanaEn;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
}

export const RegionStatus = {
  PUBLISHED: 'published', // 掲載中
  EDITING: 'editing', // 編集中
  SUSPENDED: 'suspended', // 停止中
} as const;

// RegionStatus Type
export type RegionStatus = (typeof RegionStatus)[keyof typeof RegionStatus];
