import { Test } from '@nestjs/testing';
import { PrismaService } from './../prisma/prisma.service';
// import { Store } from './entities/store.entity';
// StoreはPrismaの返却値Storeと重複するので、StoreEntityにリネーム
import { Prefecture, Store } from '../../generated/prisma';
import { CreateStoreDto } from './dto/store.dto';
import { Store as StoreEntity } from './stores.model';
import { StoresService } from './stores.service';

// PrismaServiceのMock
const mockPrismaService = {
  store: {
    // fn()はmock関数(振る舞いはテスト実施時に指定)
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// describe():関連する複数のテストケースをグループ化
describe('StoresService Test', () => {
  // DIモジュール
  let storesService: StoresService;
  let prismaService: PrismaService;
  // 正常系データ: Prismaの返却値(StoreはPrismaの型)
  let prismaMockStores: Store[];
  // 期待値: seriveの返却値(StoreEntityはStoreドメイン ※Storeという名前が重複するためStoreEntityにリネーム)
  let expectedStores: (StoreEntity & {
    id: string;
  })[];

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    //---------------------------------
    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [StoresController],
    //   providers: [StoresService],
    // })
    //---------------------------------
    // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
    // この便利なDIの仕組みはNestJSの仕組み。
    // 最後の.compile()を忘れずに
    const module = await Test.createTestingModule({
      // DI対象サービス
      providers: [
        StoresService,
        // PrismaServiceはmock(mockPrismaService)に切り替える
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    storesService = module.get<StoresService>(StoresService);
    prismaService = module.get<PrismaService>(PrismaService);

    // PrismaService Mock Data
    prismaMockStores = createMockStores();
    // 期待値：Serviceの返却値
    expectedStores = createExpectStores();
  });

  // 前処理: 書くテストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系:データがある場合は正しくドメイン型に変換して返す', async () => {
      // mockの返却値作成
      jest
        .spyOn(prismaService.store, 'findMany')
        .mockResolvedValue(prismaMockStores);

      // test対象呼び出し
      const result = await storesService.findAll();

      // 結果検証
      expect(result).toEqual(expectedStores);
    });

    it('正常系: Storeの任意項目が取得できない場合、null→undefinedで返す（1件)', async () => {
      // Storeの中にネストされたPrefectureがあった場合は、mockResulvedValueに直接[{...}]で
      // mockデータを指定すると型エラー関連の警告で怒られる。→ mockValuesの型を明示して解決
      const mockValues: (Store & { prefecture: Prefecture | null })[] = [
        {
          id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
          name: '山田電気 赤羽店',
          status: 'published',
          email: 'yamada-akabane@test.co.jp',
          phoneNumber: '03-1122-9901',
          createdAt: new Date('2025-04-05T10:00:00.000Z'),
          updatedAt: new Date('2025-04-05T12:30:00.000Z'),
          kanaName: null,
          // prefecture: null,
          holidays: [],
          zipCode: null,
          address: null,
          businessHours: null,
          userId: '633931d5-2b25-45f1-8006-c137af49e53d',
          prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
          prefecture: null,
        },
      ];
      // mockの返却値作成
      jest.spyOn(prismaService.store, 'findMany').mockResolvedValue(mockValues);
      // テスト実施
      const result = await storesService.findAll();
      // 検証
      expect(result).toEqual([
        {
          id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
          name: '山田電気 赤羽店',
          status: 'published',
          email: 'yamada-akabane@test.co.jp',
          phoneNumber: '03-1122-9901',
          createdAt: new Date('2025-04-05T10:00:00.000Z'),
          updatedAt: new Date('2025-04-05T12:30:00.000Z'),
          kanaName: undefined,
          // prefecture: undefined,
          holidays: undefined,
          zipCode: undefined,
          address: undefined,
          businessHours: undefined,
          userId: '633931d5-2b25-45f1-8006-c137af49e53d',
          prefecture: undefined,
        },
      ]);
    });

    it('正常系: Storeの任意項目が取得できない場合、null→undefinedで返す（複数件)', async () => {
      // mockの返却値作成
      // 以下のように実装してみたものの、[{...}]の形でベタ書した方がUTとしては直感的かも。。
      jest.spyOn(prismaService.store, 'findMany').mockResolvedValue(
        // Mockデータの任意項目をnullに書き換え
        prismaMockStores.map((store) => {
          store.kanaName = null;
          // store.prefecture = null;
          store.holidays = [];
          store.zipCode = null;
          store.address = null;
          store.businessHours = null;
          return Object.assign({}, store);
        }),
      );
      // テスト実施
      const result = await storesService.findAll();
      // 検証
      expect(result).toEqual(
        // 期待値の任意項目をundefinedに書き換え
        expectedStores.map((store) => {
          store.kanaName = undefined;
          // store.prefecture = undefined;
          store.holidays = undefined;
          store.zipCode = undefined;
          store.address = undefined;
          store.businessHours = undefined;
          return Object.assign({}, store);
        }),
      );
    });

    // // prismaのfindManyはデータがない場合[]を返す仕様。null,undefindedは返さない。
    it('データが0件の場合は空配列を返す', async () => {
      // prisma mock データ
      jest.spyOn(prismaService.store, 'findMany').mockResolvedValue([]);
      // テスト実施
      const result = await storesService.findAll();
      // 検証
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('正常系: 店舗情報登録(全項目)し、Storeドメイン＋idの形で返却する', async () => {
      // Prisma mock Data 設定
      jest.spyOn(prismaService.store, 'create').mockResolvedValue({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '石川県',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '石川県北区赤羽３丁目',
        businessHours: '10:00-20:00',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
        prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      });

      // テスト対象service呼び出し
      const result = await storesService.create(
        {
          name: '山田電気 能登店',
          status: 'published',
          email: 'yamada-akabane@test.co.jp',
          phoneNumber: '03-1122-9901',
          kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
          // prefecture: '石川県',
          holidays: ['WEDNESDAY', 'SUNDAY'],
          zipCode: '100-0001',
          address: '石川県北区赤羽３丁目',
          businessHours: '10:00-20:00',
        },
        '633931d5-2b25-45f1-8006-c137af49e53d',
      );

      // 検証
      expect(result).toEqual({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '石川県',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '石川県北区赤羽３丁目',
        businessHours: '10:00-20:00',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });
    });

    it('正常系: 店舗情報登録(任意項目除外)し、Storeドメイン＋idの形で返却する', async () => {
      // storesService.create()の引数作成（登録対象の店舗情報）
      const storeDto: CreateStoreDto = {
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        // kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '石川県',
        // holidays: ['WEDNESDAY', 'SUNDAY'],
        // zipCode: '100-0001',
        // address: '石川県北区赤羽３丁目',
        // businessHours: '10:00-20:00',
      };

      // Prisma mock Data 設定
      // Prismaはcreateの項目がundefined(key自体なし)でも、key: nullの形で返却する仕様
      jest.spyOn(prismaService.store, 'create').mockResolvedValue({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: null,
        // prefecture: null,
        holidays: [],
        zipCode: null,
        address: null,
        businessHours: null,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
        prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      });

      // テスト対象service呼び出し: パラメーター(任意項目削除)
      const result = await storesService.create(
        storeDto,
        '633931d5-2b25-45f1-8006-c137af49e53d',
      );

      // 検証
      expect(result).toEqual({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        // prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });
      // 1回呼ばれたか
      expect(jest.spyOn(prismaService.store, 'create')).toHaveBeenCalledTimes(
        1,
      );
      // prismaService.store.create()の引数チェック
      // 複雑な変換ロジックがないので、toHaveBeenCalledWithは不要だが一応。
      expect(jest.spyOn(prismaService.store, 'create')).toHaveBeenCalledWith({
        // objectContaining(obj)：obj内の項目と一部一致（指定したキーだけ）
        // → CreateItemDtoにある値(必須)だけを検証:単なる詰め替えなのでこの程度でOK
        // Jestの型バグのため下記↓コードを入れている。
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: storeDto.name,
          status: storeDto.status,
          email: storeDto.email,
          phoneNumber: storeDto.phoneNumber,
        }),
      });
    });

    it('正常系: 店舗情報登録(任意項目undefind)し、Storeドメイン＋idの形で返却する', async () => {
      // storesService.create()の引数作成（登録対象の店舗情報）
      const storeDto: CreateStoreDto = {
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        // prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
      };

      // Prisma mock Data 設定
      // Prismaはcreateの項目がundefined(key自体なし)でも、key: nullの形で返却する仕様
      jest.spyOn(prismaService.store, 'create').mockResolvedValue({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: null,
        // prefecture: null,
        holidays: [],
        zipCode: null,
        address: null,
        businessHours: null,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
        prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      });

      // テスト対象service呼び出し: パラメーター(任意項目削除)
      const result = await storesService.create(
        storeDto,
        '633931d5-2b25-45f1-8006-c137af49e53d',
      );

      // 検証
      expect(result).toEqual({
        id: 'a1111111-1234-462c-b7d0-7e452ba0f111',
        name: '山田電気 能登店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        // prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });
      // 1回呼ばれたか
      expect(jest.spyOn(prismaService.store, 'create')).toHaveBeenCalledTimes(
        1,
      );
      // prismaService.store.create()の引数チェック
      // 複雑な変換ロジックがないので、toHaveBeenCalledWithは不要だが一応。
      expect(jest.spyOn(prismaService.store, 'create')).toHaveBeenCalledWith({
        // objectContaining(obj)：obj内の項目と一部一致（指定したキーだけ）
        // → CreateItemDtoにある値(必須)だけを検証:単なる詰め替えなのでこの程度でOK
        // Jestの型バグのため下記↓コードを入れている。
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          name: storeDto.name,
          status: storeDto.status,
          email: storeDto.email,
          phoneNumber: storeDto.phoneNumber,
        }),
      });
    });
  });
});

/**
 * Prismaの返却値(Store配列)を作成
 */
// 型は、Prisma.StoreGetPayload<{ include: { prefecture: true } }>[]が便利だが、@prisma/clientの
// import問題なのか、エラーになったので、(Store & { prefecture: Prefecture | null })[]としている。
function createMockStores(): (Store & { prefecture: Prefecture | null })[] {
  const stores: (Store & { prefecture: Prefecture | null })[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      prefecture: {
        id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      name: '山田電気 江戸川店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      prefecture: {
        id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },

    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      name: '山田電気 銀座店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefectureId: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      prefecture: {
        id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
  ];
  return stores;
}

// 期待値作成：serviceの返却値
function createExpectStores(): (StoreEntity & { id: string })[] {
  const stores: (StoreEntity & { id: string })[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      name: '山田電気 江戸川店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      name: '山田電気 銀座店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
  ];

  return stores;
}
