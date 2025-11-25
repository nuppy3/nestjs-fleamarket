import { Test } from '@nestjs/testing';
import { Store } from 'generated/prisma';
import { PrismaService } from '../prisma/prisma.service';
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

// descrive():関連する複数のテストケースをグループ化
describe('StoresService Test', () => {
  // DIモジュール
  let storesService: StoresService;
  let prismaService: PrismaService;
  let prismaMockStores: Store[];

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
      const result: StoreEntity[] = await storesService.findAll();

      // 結果検証
      expect(result).toEqual(prismaMockStores);
    });

    // // prismaのfindManyはデータがない場合[]を返す仕様。null,undefindedは返さない。
    it('データが0件の場合は空配列を返す', () => {});
  });

  describe('create', () => {
    it('正常系', () => {});
  });
});

/**
 * Prismaの返却値(Store配列)を作成
 */
function createMockStores(): Store[] {
  const stores: Store[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      name: '山田電気 江戸川店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      name: '山田電気 銀座店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return stores;
}
