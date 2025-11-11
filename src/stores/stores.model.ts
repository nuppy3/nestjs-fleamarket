//------------------------------------------
// ビジネスロジックやアプリ内で使う型定義
// type・interface・enum・union などをまとめる。
//------------------------------------------

/**
 * 店舗情報 （Domainモデル)
 * アプリ内部（Service・UseCase・他ドメイン）で使う「中核的な型」。
 * HTTP層ではDTO(request/response)、DB層ではPrismaの型、その中間(service)で橋渡し役を
 * 担うのが Store です。
 *
 * 使用例①：DB層のPrismaの型(DBのレスポンス)をmodel.tsのStoreに変換して、Controllerへ
 *      （DB→Storeに変換→Controller）
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
export type Store = {
  id: string;
  name: string;
  kanaName?: string;
  status: StoreStatus;
  zipCode?: string;
  email: string;
  address?: string;
  prefecture?: string;
  phoneNumber: string;
  businessHours?: string;
  holiday?: Weekday[];
};

export enum StoreStatus {
  PUBLISHED = 'published', // 掲載中
  EDITING = 'editing', // 編集中
  SUSPENDED = 'suspended', // 停止中
}

// 上記のenumと以下のunionどっちにしようかな問題 → unionが軽量でas const/(typeof StoreStatus)[number]
// のコラボで、unionがトレンドっぽいね。
// export type StoreStatus = 'published' | 'editing' | 'suspended';

// ------------------------------------------------
// 配列から自動的に Union 型を生成するテクニック
// この構成は、TypeScriptのenumより軽く・柔軟で、
// PrismaやNestJSでもよく使われる「modern enumパターン」 です。
// ------------------------------------------------
export const WEEKDAYS = [
  // ↑type Weekday(パスカルケース) に変換したいので被らない様に全て大文字にしている?
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

// union型 ： 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
export type Weekday = (typeof WEEKDAYS)[number];

// Weekdayの日本語変換
// オブジェクトの型を簡潔に定義するためのユーティリティ型:Record<K, T>
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
