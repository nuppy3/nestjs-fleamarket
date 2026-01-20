//------------------------------------------
// ビジネスロジックやアプリ内で使う型定義
// type・interface・enum・union などをまとめる。
//------------------------------------------

import { Prefecture } from '../prefectures/prefectures.model';

/**
 * 店舗情報 （Domainモデル)
 *
 * ドメインモデル(データ構造だけ持つ場合)はtypeではなくInterfaceがベストプラクティス。
 * (ビジネスルール（ロジック）を持つ場合は、classがベスト)
 *
 * アプリ内部（Service・UseCase・他ドメイン）で使う「中核的な型」。
 * HTTP層ではDTO(request/response)、DB層ではPrismaの型、その中間(service)で橋渡し役を
 * 担うのが Store です。
 *
 * 使用例①：DB層のPrismaの型(DBのレスポンス)をmodel.tsのStoreに変換して、Controllerへ
 *      （DB→Storeに変換→Controller）逆も然り(Controller→Store→DB)
 *
 * Service層は「アプリ的に意味のある構造」を扱える。
 *
 * 使用例②：複数のserviceやControllerで共通的に利用
 * export class ReservationService {
 *  async validateStoreAvailability(store: Store): Promise<boolean> {
 *   // statusがSUSPENDEDの店舗では予約を受け付けない
 *   return store.status !== 'suspended';
 *  }
 * }
 *
 * 補足：店舗情報取得API」みたいに単純なケースでは、Store（ドメインモデル）／Prismaの型／レスポンスDTO が
 * ほぼ同じになる。
 * → 同じに見えても分けておくことに意味はある！！
 * 単純なCRUD APIの段階では完全に同じになります。が、設計が進むにつれ、以下の設計に伴う型のズレが生じる。
 * ・「論理削除フラグ、オーナーIDなど、外部に見せないカラムが追加」→Prisma層の型のズレ
 * ・複数のテーブルを統合して1つのドメインにまとめる（例：店舗＋オーナー情報）→ model.tsのStore型のズレ
 * ・APIごとに出力内容やフィールド名を調整（例：statusを日本語化）→ DTOのズレ
 * 3者の関心ごとは確実に分かれていきます。
 */
export interface Store {
  // id(uuid)は「技術的識別子」であり、ビジネスルールには関係がない。
  // Storeドメイン(entity)にはid(uuid)を持たせない！id(uuid)はDB、infra管轄：idに依存しない純粋なドメイン
  //「作成時は id なし、取得時(レスポンス)は id あり（別型）」＝ 完全に正しい設計むしろこれが「本物のドメイン駆動設計」
  // が、実務的に、idを持たせてもいいっぽいが、厳密にidを除外してみる。
  // id: string;
  name: string;
  kanaName?: string;
  status: StoreStatus;
  zipCode?: string;
  email: string;
  address?: string;
  phoneNumber: string;
  businessHours?: string;
  holidays?: Weekday[];
  // idはdomainから除外しており、以下も除外対象であるが、作成日などはある種のビジネルルールとも
  // 考えられるのでdomainに含める(ほぼ入れるらしい)
  createdAt: Date;
  updatedAt: Date;
  // Userとのリレーション
  userId: string;
  // Prefecture：値オブジェクト(prefectureというstringを持つのではなくオブジェクトを持たせる)
  // prefecture?: string;
  prefecture?: Prefecture;
}

// enum キーワードは完全に死にました。→ enumを見つけたら即りファクタ（新人教育）
// export enum StoreStatus {
//   PUBLISHED = 'published', // 掲載中
//   EDITING = 'editing', // 編集中
//   SUSPENDED = 'suspended', // 停止中
// }

// 20251029
// 上記のenumと以下のunionどっちにしようかな問題 → unionが軽量でas const/(typeof StoreStatus)[number]
// のコラボで、unionがトレンドっぽいね。
// export type StoreStatus = 'published' | 'editing' | 'suspended';
//--------------------------------------
// 20251119
// enumキーワードの時代は終わった
// as const オブジェクト + typeof ~[keyof ~]の定義が新のenum！！
// 以下の類似パターンは、オブジェクトから値全部を集めて自動的にunion型にするテクニック
// 「modern enumパターン」です。
//
// as constを付けると、「typeof StoreStatus」すると、{ readonly PUBLISHED: 'published'; readonly EDITING: 'editing'; readonly: SUSPENDED: 'suspended'}としてリテラル型の具体的な値'published'という文字列になる
export const StoreStatus = {
  PUBLISHED: 'published', // 掲載中
  EDITING: 'editing', // 編集中
  SUSPENDED: 'suspended', // 停止中
} as const;
// StoreStatus（モダンenum=union）の型を定義
export type StoreStatus = (typeof StoreStatus)[keyof typeof StoreStatus];

// ------------------------------------------------
// 配列から自動的に Union 型を生成するテクニック
// この構成は、TypeScriptのenumより軽く・柔軟で、
// PrismaやNestJSでもよく使われる「modern enumパターン」 です。
// ------------------------------------------------
export const WEEKDAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

// ・as const構文：リテラル型を固定する魔法の様な構文
// const colors = ['red', 'green', 'blue']; を 「typeof colors」 すると、「string[]」が返る。
// → 当たり前だが、「red」「green」「blue」という具体的な文字列は失われていて、「stringの配列」としてしか認識されません。
// const colors = ['red', 'green', 'blue'] as const; as constを付けて、「typeof colors」 すると、
// readonly ['red', 'green', 'blue'] が返る。
// → 配列の中身が「リテラル（文字列そのもの）」として保持され、読み取り専用になる。
// ※typeof は通常「変数の値の型を取得する」演算子
//
// typeof WEEKDAYS: readonly ['SUNDAY', 'MONDAY', ....];が返る
// [number] って何?: ここが少しマジカルですが、配列の型に [number] をつけると、「配列のすべての要素の型」を
// 取り出す、という意味になります。
// → type Weekday = (typeof WEEKDAYS)[number];  'SUNDAY' | 'MONDAY' | 'TUESDAY' | ... が返る。
//

// union型 ： 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
export type Weekday = (typeof WEEKDAYS)[number];

// Weekdayの日本語変換
// Record<K, T>：オブジェクトの型を簡潔に定義するためのユーティリティ型
// 「キーがK、値がTのオブジェクト」を作成する。「キーを K の集合に固定して、値の型を T に統一する」型安全な
// 辞書（Map）のようなものです📘。
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  SUNDAY: '日',
  MONDAY: '月',
  TUESDAY: '火',
  WEDNESDAY: '水',
  THURSDAY: '木',
  FRIDAY: '金',
  SATURDAY: '土',
};

/**
 * 曜日変換メソッド(安全＋再利用性）
 * 使用例：getWeekdayLabel('MONDAY'); // => "月"
 * @param weekday
 * @returns
 */
export function getWeekdayLabel(weekday: Weekday): string {
  return WEEKDAY_LABELS[weekday];
}

/**
 * 店舗一覧取得（findAll）で使用するフィルタ条件
 *
 * @example
 * ```ts
 * // 東京都の店舗のみ取得
 * await storesService.findAll({ prefectureCode: "13" });
 *
 * // 全店舗取得（フィルタなし）
 * await storesService.findAll();
 * ```
 */
export interface StoreFilter {
  // 都道府県コード（例: "01" = 北海道, "13" = 東京都）
  // 指定がない場合は全店舗を対象とする
  prefectureCode?: string;

  // 将来追加予定の例（コメントアウト推奨）
  // /**
  //  * 店舗ステータスでフィルタ
  //  * @see StorStatus
  //  */
  // status?: StorStatus;
}
