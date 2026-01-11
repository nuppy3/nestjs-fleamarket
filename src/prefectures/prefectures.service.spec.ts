import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// import { PrismaClientKnownRequestError } from '../../generated/prisma/runtime/library';
// import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Prefecture as PrismaPrefecture } from '../../generated/prisma';
import { PrismaService } from './../prisma/prisma.service';
import { CreatePrefectureDto } from './dto/prefecture.dto';
import { Prefecture, PrefectureWithCoverage } from './prefectures.model';
import { PrefecturesService } from './prefectures.service';

const mockPrismaSercie = {
  prefecture: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('□□□ Prefecture Test □□□', () => {
  // DIモジュール
  let prefectureService: PrefecturesService;
  let prismaService: PrismaService;
  let prismaMockPrefectures: PrismaPrefecture[];
  let expectedPrefectures: (Prefecture & { id: string })[];

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [PrefecturesController],
    //   providers: [PrefecturesService],
    // })

    const module = await Test.createTestingModule({
      providers: [
        PrefecturesService,
        { provide: PrismaService, useValue: mockPrismaSercie },
      ],
    }).compile();

    prefectureService = module.get<PrefecturesService>(PrefecturesService);
    prismaService = module.get<PrismaService>(PrismaService);

    // mock data
    prismaMockPrefectures = createPrismaMockData();
    // 期待値
    expectedPrefectures = createExpectedData();
  });

  // 前処理: 書くテストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系: Prefecture配列、全項目(prefectureドメイン配列)を返却する', async () => {
      // prisma mock data 作成
      jest
        .spyOn(prismaService.prefecture, 'findMany')
        .mockResolvedValue(prismaMockPrefectures);
      // テスト対象service呼び出し
      const result = await prefectureService.findAll();
      // 検証
      expect(result).toEqual(expectedPrefectures);
    });
    it('正常系: データが0件の場合は空配列を返却する', async () => {
      // prisma mock data 作成(Prismaは０件の場合、空配列を返却する仕様)
      jest.spyOn(prismaService.prefecture, 'findMany').mockResolvedValue([]);
      // test 対象 service 呼び出し
      const result = await prefectureService.findAll();
      // 検証
      expect(result).toEqual([]);
    });
  });

  describe('findAllWithStoreCount', () => {
    it('正常系： domain専用モデル(PrefectureWithCoverage[])を返却する(全項目)', async () => {
      // prisma mock data
      const prismaMockData = createPrismaMockDataIncludeStoreCount();
      jest
        .spyOn(prismaService.prefecture, 'findMany')
        .mockResolvedValue(prismaMockData);

      // テスト対象servie呼び出し
      const results = await prefectureService.findAllWithStoreCount();

      // 検証
      const expectedData = createExpectedPrefectureWithCoverageData();
      expect(results).toEqual(expectedData);
    });

    it('正常系： データが0件の場合は空配列を返却する', async () => {
      // prisma mock data
      jest.spyOn(prismaService.prefecture, 'findMany').mockResolvedValue([]);
      // test対象service呼び出し
      const results = await prefectureService.findAllWithStoreCount();
      // 検証
      expect(results).toEqual([]);
    });

    it('異常系①: その他エラーのテスト：元のエラーをそのままスローする', async () => {});
  });

  describe('create', () => {
    // serviceの引数作成
    const dto: CreatePrefectureDto = {
      name: '石川県',
      code: '24',
      kanaName: 'イシカワ',
      kanaEn: 'ishikawa',
      status: 'published',
    };

    // ----------------------------------------------------------------
    // 1. 正常ケースのテスト
    // ----------------------------------------------------------------
    it('正常系: Prefectureの情報を登録(全項目)し、prefectureドメイン(全項目)を返却する', async () => {
      // prisma modk data 作成
      jest.spyOn(prismaService.prefecture, 'create').mockResolvedValue({
        id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
        name: '石川県',
        code: '24',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });

      // テスト対象service呼び出し
      const result = await prefectureService.create(dto);

      // 検証
      expect(result).toEqual({
        id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
        name: '石川県',
        code: '24',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });
    });

    // ----------------------------------------------------------------
    // 2. エラーケースのテスト ： catch句のテスト
    // ----------------------------------------------------------------
    it('異常系①: Prefectureの情報を登録(全項目)し、一時制約エラー(P2002)の検証', async () => {
      // prismaのP2002エラーのmockを作成
      // PrismaClientKnownRequestError：クエリエンジンがリクエストに関連する既知のエラー (たとえば、一意制約違反)
      // を返す場合、Prisma Client は例外をスローします。
      // 一意制約、アクセス不可などは当該Errorは同じで、codeが違うだけ。
      const mockP2002Error = new PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`code`)',
        {
          code: 'P2002',
          clientVersion: 'test-version',
          meta: { target: ['code'] }, // 一意制約違反のフィールド
        },
      );

      // Pricmaが、P2002 エラーを返すように設定
      // Errorを返却させたい場合はmockRejectedValue()でcreateのPrisma<Prefecture & {id:string}>の
      // 返却をアンラップして、Errorを返すようにする）
      jest
        .spyOn(prismaService.prefecture, 'create')
        .mockRejectedValue(mockP2002Error);

      // test対象service呼び出し、結果検証
      // ConflictExceptionがスローされることをテスト
      await expect(prefectureService.create(dto)).rejects.toThrow(
        ConflictException,
      );

      // ConflictExceptionのmessageが正しいことを検証
      await expect(prefectureService.create(dto)).rejects.toThrow(
        '指定された code は既に存在します。',
      );
    });
    it('異常系②: P2002以外のPrismaエラーの場合、そのままエラーをスローする', async () => {
      // P2002以外のエラーを作成（なんでもいいが、P2000:値が長すぎるエラーにしておく)
      const mockP2000Error = new PrismaClientKnownRequestError(
        'Value too long for column',
        { code: 'P2000', clientVersion: 'test-version' },
      );

      // prismaServiceのmock(Error)を設定
      jest
        .spyOn(prismaService.prefecture, 'create')
        .mockRejectedValue(mockP2000Error);

      // serviceを呼び出し、結果を検証
      await expect(prefectureService.create(dto)).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
      // Errorに以下が含まれることを検証（このテストはなくてもいいか）
      await expect(prefectureService.create(dto)).rejects.toHaveProperty(
        'code',
        'P2000',
      );
    });

    it('異常系③: その他エラーのテスト：元のエラーをそのままスローする', async () => {
      // PrismaClientKnownRequestError以外の一般エラーを作成
      const mockGenericError = new Error('Database connection failed');

      // モックの実装: create()が一般のエラーを投げるように設定
      jest
        .spyOn(prismaService.prefecture, 'create')
        .mockRejectedValue(mockGenericError);

      // 元のエラー（Generic Error）がそのまま再スローされることをテスト
      await expect(prefectureService.create(dto)).rejects.toThrow(Error);
      await expect(prefectureService.create(dto)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('findByCodeOrFail', () => {
    it('正常系：codeに紐づくPrefectureを取得(全項目)し、domain型に変換して返却する', async () => {
      // findBYCodeOrFailの引数
      const code: string = '01';

      // PrismaのMockデータ作成
      const prismaMockPrefecture = prismaMockPrefectures.find(
        (prefecture) => prefecture.code === code,
      )!;

      // Prisma Modkデータセット
      jest
        .spyOn(prismaService.prefecture, 'findUnique')
        .mockResolvedValue(prismaMockPrefecture);

      // テスト対象のfindByCodeOrFail
      const result = await prefectureService.findByCodeOrFail(code);

      // 検証
      expect(result).toEqual(
        expectedPrefectures.find((prefecture) => prefecture.code === code),
      );
    });

    // it('正常系：codeに紐づくPrefectureを取得。任意項目がnullの場合undefinedに変換して返却する。', () => {});
    it('異常系：codeに紐づくPrefectureを取得(0件)、NotFoundExceptionをスローする', () => {});
  });
});

// Prisma Mock Data 作成
function createPrismaMockData(): PrismaPrefecture[] {
  const domains: PrismaPrefecture[] = [
    {
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '北海道',
      code: '01',
      kanaName: 'ホッカイドウ',
      status: 'published',
      kanaEn: 'hokkaido',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '274d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '青森',
      code: '02',
      kanaName: 'アオモリ',
      status: 'published',
      kanaEn: 'aomori',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '374d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '秋田',
      code: '03',
      kanaName: 'アキタ',
      status: 'published',
      kanaEn: 'akita',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '474d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '岩手',
      code: '04',
      kanaName: 'イワテ',
      status: 'published',
      kanaEn: 'iwate',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '574d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山形',
      code: '05',
      kanaName: 'ヤマガタ',
      status: 'published',
      kanaEn: 'yamagata',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '東京都',
      code: '13',
      kanaName: 'トウキョウト',
      status: 'published',
      kanaEn: 'tokyo-to',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return domains;
}

function createPrismaMockDataIncludeStoreCount(): (PrismaPrefecture & {
  _count: { store: number };
})[] {
  const domains: (PrismaPrefecture & { _count: { store: number } })[] = [
    {
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '北海道',
      code: '01',
      kanaName: 'ホッカイドウ',
      status: 'published',
      kanaEn: 'hokkaido',
      _count: { store: 1 },
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '東京都',
      code: '13',
      kanaName: 'トウキョウト',
      status: 'published',
      kanaEn: 'tokyo-to',
      _count: { store: 10 },
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return domains;
}

// 期待値作成
function createExpectedData(): (Prefecture & { id: string })[] {
  const domains: (Prefecture & { id: string })[] = [
    {
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '北海道',
      code: '01',
      kanaName: 'ホッカイドウ',
      status: 'published',
      kanaEn: 'hokkaido',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '274d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '青森',
      code: '02',
      kanaName: 'アオモリ',
      status: 'published',
      kanaEn: 'aomori',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '374d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '秋田',
      code: '03',
      kanaName: 'アキタ',
      status: 'published',
      kanaEn: 'akita',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '474d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '岩手',
      code: '04',
      kanaName: 'イワテ',
      status: 'published',
      kanaEn: 'iwate',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '574d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山形',
      code: '05',
      kanaName: 'ヤマガタ',
      status: 'published',
      kanaEn: 'yamagata',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '東京都',
      code: '13',
      kanaName: 'トウキョウト',
      status: 'published',
      kanaEn: 'tokyo-to',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return domains;
}

function createExpectedPrefectureWithCoverageData(): PrefectureWithCoverage[] {
  const domains: PrefectureWithCoverage[] = [
    {
      prefecture: {
        name: '北海道',
        code: '01',
        kanaName: 'ホッカイドウ',
        status: 'published',
        kanaEn: 'hokkaido',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      storeCount: 1,
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
      storeCount: 10,
    },
  ];
  return domains;
}
