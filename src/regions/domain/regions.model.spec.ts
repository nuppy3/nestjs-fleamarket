import { ReconstituteRegionProps, Region, RegionStatus } from './regions.model';

describe('□□□ Region Domain Test □□□', () => {
  describe('------ remobe() test ------', () => {
    // -----------------------------
    // remove() test
    // -----------------------------
    it('正常系: validateCanDeleteを通過し、statusとupdatedAtが更新されること', () => {
      // Region domain 生成
      const region = Region.reconstitute({
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      }) satisfies ReconstituteRegionProps;

      // 実行直前の時刻
      const before = new Date();

      // test対象のfunction呼び出し
      region.remove();

      // 検証
      expect(region.status).toBe(RegionStatus.SUSPENDED);
      // 日付、時刻の検証について、誤差を認める方法
      // 「1秒以内に実行されたか」という検証で、Jestの toBeGreaterThan（より大きい）などを使い
      // 実行後の時刻が、実行前よりも未来であることを確認するやり方があるようです。
      expect(region.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
    });

    it('異常系: 削除対象のRegionが既に停止中の場合、Errorをスローする', () => {
      const region = Region.reconstitute({
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: RegionStatus.SUSPENDED, // 'suspended'
        kanaEn: 'hokkaidou',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // ✅ 実行せずに「リモコン（アロー関数）」だけを渡す
      // 前に region.remove() を単体で書かないこと！
      // region.remove(): 「今すぐ爆弾を起動しろ！」
      // () => region.remove(): 「爆弾を起動するためのリモコンです。どうぞ」
      expect(() => region.remove()).toThrow(
        `この地域はすでに利用停止状態です。地域： ${region.name}`,
      );
    });
  });
});
