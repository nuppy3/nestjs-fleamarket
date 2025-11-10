export type Store = {
  id: string;
  name: string;
  status: StoreStatus;
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
