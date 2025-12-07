import { Test } from '@nestjs/testing';
import { Prefecture } from '../../generated/prisma';
import { PrismaService } from './../prisma/prisma.service';
import { CreatePrefectureDto } from './dto/prefecture.dto';
import { PrefecturesService } from './prefectures.service';

const mockPrismaSercie = {
  prefecture: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('□□□ Prefecture Test □□□', () => {
  // DIモジュール
  let prefectureService: PrefecturesService;
  let prismaService: PrismaService;
  let prismaMockPrefectures: Prefecture[];
  let expectedPrefectures: Prefecture[];

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

  describe('create', () => {
    it('正常系: Prefectureの情報を登録(全項目)し、prefectureドメイン(全項目)を返却する', () => {
      // serviceの引数作成
      const dto: CreatePrefectureDto = {
        name: '石川県',
        code: '24',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
      };

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
    });
    it('異常系①: Prefectureの情報を登録(全項目)し、prefectureドメイン(全項目)を返却する', () => {});
    it('異常系②: Prefectureの情報を登録(全項目)し、prefectureドメイン(全項目)を返却する', () => {});
  });
});

function createPrismaMockData(): Prefecture[] {
  const domains: Prefecture[] = [
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
// 期待値作成
function createExpectedData(): Prefecture[] {
  const domains: Prefecture[] = [
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
