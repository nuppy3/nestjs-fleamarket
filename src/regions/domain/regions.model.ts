/**
 * Region domain 全属性(完全な状態)
 */
interface RegionState {
  code: string;
  name: string;
  kanaName: string;
  kanaEn: string;
  status: RegionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 【新規作成用】
 * Region domain作成時に必要はプロパティを型として定義
 * 外部から入力される項目のみ（statusや日付は内部で生成するため除外）
 */
export type CreateRegionProps = Omit<
  RegionState,
  'status' | 'createdAt' | 'updatedAt'
>;

/**
 * 【再構成用】
 * DB等から戻ってくる全項目
 */
export type ReconstituteRegionProps = RegionState;

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

    // → propsの項目（code,nameなど）をprivateにしたことでOmit<Region,...>の型だとエラーになるため
    // 以下のようにRegionProps(interface)に切り替え（こちらばBP）
    // → CreateRegionPropsに修正
    props: CreateRegionProps,
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
  static reconstitute(props: ReconstituteRegionProps): Region {
    return new Region(
      props.code,
      props.name,
      props.kanaName,
      props.status,
      props.kanaEn,
      props.createdAt,
      props.updatedAt,
      // memo: 以下のようにスプレッド構文はNG（理由がちょっと深いのでmemoしておく
      // ...props,
      //
      // ・オブジェクトの複製（これはOK）
      // const newObj = { ...props };
      // これは「新しいオブジェクトの中に、プロパティをコピーする」という意味なので通ります。
      //
      // ・関数の引数への展開（これがNG）
      // new Region(...props);
      // これは「props の中身を、1番目の引数、2番目の引数…として順番に渡す」という意味になります。
      // オブジェクトには「1番目」という概念がないため、エラーになります。
    );
  }

  /**
   * domain delete(ソフトデリート)
   * デリートロジックを集約（serviceなどに漏らさない)
   *
   * 当該メソッドは、すでに存在する「特定のデータ（自分自身の状態）」を持つオブジェクトに対して
   * 命令を下すメソッドなので、staticではなく、インスタンスメソッド。
   *
   * ・デリートしてもいいかの判定
   *  例：
   *  - すでに利用停止状態の場合は削除しない(エラーを投げる）
   *  - 紐づく都道府県が存在する場合は削除しない
   * ・ソフトデリート（＝status: 停止/ updateAtの更新)
   */
  remove() {
    // 削除可能か判定(ガード節)：ドメインルール
    this.validateCanDelete();

    // ステータス更新と更新日付セット
    this._status = RegionStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  /**
   * 削除（利用停止）が可能かどうかのビジネスルールを判定
   * 判定NGの場合はエラーをスロー(ガード節)
   *
   * 外部から「削除ボタンを表示するかどうか」の判定にも使えるよう public にするのもアリです
   */
  private validateCanDelete(): void {
    // ルール①：既に停止中の場合
    if (this._status === RegionStatus.SUSPENDED) {
      throw new Error(`この地域はすでに利用停止状態です。地域： ${this._name}`);
    }

    // TODO // ルール② 例：紐づく都道府県が存在する場合は削除不可（参照整合性）

    // TODO // ルール③ 例：ビジネスルール（例: 現在キャンペーン実施中は削除不可）

    // TODO // ルール④ 例：北陸地方（code:05）の場合、特定の期間中は削除不可
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
