import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { Region as PrismaRegion } from '../../generated/prisma';
import { Region } from './regions.model';
import { RegionsService } from './regions.service';

const mockPrismaSercie = {
  region: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

describe('■■■ Region test ■■■', () => {
  // DIモジュール
  let regionsService: RegionsService;
  let prismaService: PrismaService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [RegionsController],
    //   providers: [RegionsService],
    // })

    const module = await Test.createTestingModule({
      providers: [
        RegionsService,
        { provide: PrismaService, useValue: mockPrismaSercie },
      ],
    }).compile();

    regionsService = module.get<RegionsService>(RegionsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // 前処理: 書くテストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系: Regionドメイン配列(全項目)を返却する', async () => {
      // prisma mock data 作成
      const mockData = createPrismaMockData();
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue(mockData);

      // test対象service呼び出し
      const results = await regionsService.findAll();

      // 検証
      const expectedData = createExpectedData();
      expect(results).toEqual(expectedData);
    });

    it('正常系: Regionデータが０件の場合は空配列を返却する', async () => {
      // prisma mock data 作成
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue([]);
      // test対象service呼び出し
      const results = await regionsService.findAll();
      // 検証
      expect(results).toEqual([]);
    });

    // エラーを隠蔽・変換せずに透過的に投げているか
    it('異常系: エラーが発生した場合、元のエラーをそのままスローする(DB接続エラー)', async () => {
      // PrismaClientKnownRequestError以外の一般エラーを作成
      const mockGenericError = new Error('Database connection failed');

      // モックの実装: create()が一般のエラーを投げるように設定
      jest
        .spyOn(prismaService.prefecture, 'findMany')
        .mockRejectedValue(mockGenericError);

      // 元のエラー（Generic Error）がそのままスローされることをテスト
      await expect(regionsService.findAll()).rejects.toThrow(Error);
      await expect(regionsService.findAll()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});

/**
 * Prisma Mock Data作成
 * @returns Prisma Mock Data
 */
function createPrismaMockData(): PrismaRegion[] {
  const mockData: PrismaRegion[] = [
    {
      id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      name: '北海道',
      code: '01',
      kanaName: 'ほっかいどう',
      status: 'published',
      kanaEn: 'hokkaidou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
      name: '東北',
      code: '02',
      kanaName: 'とうほく',
      status: 'published',
      kanaEn: 'tohoku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0324dc98-89a2-4db1-9431-b20feff57700',
      name: '関東',
      code: '03',
      kanaName: 'kanto',
      status: 'published',
      kanaEn: 'kantou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0424dc98-89a2-4db1-9431-b20feff57700',
      name: '東海',
      code: '04',
      kanaName: 'とうかい',
      status: 'published',
      kanaEn: 'tokai',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0524dc98-89a2-4db1-9431-b20feff57700',
      name: '北陸',
      code: '05',
      kanaName: 'ほくりく',
      status: 'published',
      kanaEn: 'hokuriku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return mockData;
}

/**
 * 期待値作成
 * @returns 期待値
 */
function createExpectedData(): (Region & { id: string })[] {
  const mockData: (Region & { id: string })[] = [
    {
      id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      name: '北海道',
      code: '01',
      kanaName: 'ほっかいどう',
      status: 'published',
      kanaEn: 'hokkaidou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
      name: '東北',
      code: '02',
      kanaName: 'とうほく',
      status: 'published',
      kanaEn: 'tohoku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0324dc98-89a2-4db1-9431-b20feff57700',
      name: '関東',
      code: '03',
      kanaName: 'kanto',
      status: 'published',
      kanaEn: 'kantou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0424dc98-89a2-4db1-9431-b20feff57700',
      name: '東海',
      code: '04',
      kanaName: 'とうかい',
      status: 'published',
      kanaEn: 'tokai',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '0524dc98-89a2-4db1-9431-b20feff57700',
      name: '北陸',
      code: '05',
      kanaName: 'ほくりく',
      status: 'published',
      kanaEn: 'hokuriku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return mockData;
}
