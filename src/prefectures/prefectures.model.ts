/**
 * 都道府県情報 （Domainモデル)
 */
export interface Prefecture {
  // id(uuid)は「技術的識別子」であり、ビジネスルールには関係がない。
  // Storeドメイン(entity)にはid(uuid)を持たせない！id(uuid)はDB、infra管轄：idに依存しない純粋なドメイン
  //「作成時は id なし、取得時(レスポンス)は id あり（別型）」＝ 完全に正しい設計むしろこれが「本物のドメイン駆動設計」
  // が、実務的に、idを持たせてもいいっぽいが、厳密にidを除外してみる。
  // id: string;
  name: string;
  code: string;
  kanaName: string;
  status: PrefectureStatus;
  kanaEn: string;
  createdAt: Date;
  updatedAt: Date;
}

// modern enumパターン（union)
export const PrefectureStatus = {
  PUBLISHED: 'published', // 掲載中
  SUSPENDED: 'suspended', // 停止中
} as const;
// StoreStatus（モダンenum=union）の型を定義()
// 上記の 「const PrefectureStatus」はあくまでconstオブジェクト(値)であり、PageStatusという型ではないので
// type PageStatusとして型を定義している。
export type PrefectureStatus =
  (typeof PrefectureStatus)[keyof typeof PrefectureStatus];
