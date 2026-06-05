import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Region as PrismaRegion } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RegionAlreadyPublishedException,
  RegionAlreadySuspendedException,
} from '../domain/errors/regions.exceptions';
import {
  REGION_REPOSITORY_PORT,
  RegionRepositoryPort,
} from '../domain/region.repository.port';
import { RegionsDomainService } from '../domain/regions.domain.service';
import {
  ReconstituteRegionProps,
  Region,
  RegionStatus,
} from '../domain/regions.model';
import { CreateRegionDto } from '../dto/region.dto';
import { UpdateRegionDto } from '../dto/update-region.dto';
import { RegionsService } from './regions.service';
import { RegionsQueryServiceService } from './regions.query.service';

// MockService定義
const mockPrismaService = {
  region: {
    findMany: jest.fn(),
    // create: jest.fn(),
    // findUnique: jest.fn(),
    // update: jest.fn(),
    // upsert: jest.fn(),
  },
};

describe('■■■ Region Query Service test ■■■', () => {
  // DIモジュール
  let regionsService: RegionsQueryServiceService;
  let prismaService: PrismaService;
  // RegionRepositoryをinterface化したのでコメント
  // let regionRepository: RegionRepository;
  let regionRepository: RegionRepositoryPort;
  let regionsDomainService: RegionsDomainService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [RegionsController],
    //   providers: [RegionsService, RegionRepository, RegionsDomainService],
    // })

    const module = await Test.createTestingModule({
      providers: [
        RegionsService,
        { provide: PrismaService, useValue: mockPrismaService },
        // Repositoryはinterfaceを実装しているのでtoken(=REGION_REPOSITORY_PORT)で指定
        {
          provide: REGION_REPOSITORY_PORT,
          useValue: mockRegionRepository,
        },
        { provide: RegionsDomainService, useValue: mockRegionsDomainService },
      ],
    }).compile();

    regionsService = module.get<RegionsService>(RegionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    regionRepository = module.get<RegionRepositoryPort>(REGION_REPOSITORY_PORT);
    regionsDomainService =
      module.get<RegionsDomainService>(RegionsDomainService);
  });

  // 前処理: 各テストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    // jest.clearAllMocks();
    jest.resetAllMocks();
  });

  //--------------------------------------
  // findAll test
  //--------------------------------------
  describe('findAll', () => {
    it('正常系: Regionドメイン配列(全項目)を返却する', async () => {
      // prisma mock data 作成
      const mockData = createPrismaMockData();
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue(mockData);

      // test対象service呼び出し
      const results = await regionsService.findAll();

      // 検証: プロパティのみ検証
      const expectedData = createExpectedData();
      // 以下のexpect.objectContaining(expectedData)での比較だと_codeとcodeでの
      // 比較をしてしまうのでNG
      // expect(results).toEqual(expect.objectContaining(expectedData));

      // toMatchObjectでの比較はgetterをベースに比較してくれる
      expect(results).toMatchObject(expectedData);
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
        .spyOn(prismaService.region, 'findMany')
        .mockRejectedValue(mockGenericError);

      // 元のエラー（Generic Error）がそのままスローされることをテスト
      await expect(regionsService.findAll()).rejects.toThrow(Error);
      await expect(regionsService.findAll()).rejects.toThrow(
        'Database connection failed',
      );
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
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
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
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
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
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
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
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
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
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    },
  ];
  return mockData;
}

/**
 * repository Mock Data作成
 * @returns repository Mock Data (region domain + id の配列)
 */
function createRepositoryMockData(): (Region & { id: string })[] {
  const regions: Region[] = [
    Region.reconstitute({
      // id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      name: '北海道',
      code: '01',
      kanaName: 'ほっかいどう',
      status: 'published',
      kanaEn: 'hokkaidou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    } satisfies ReconstituteRegionProps),
    Region.reconstitute({
      // id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
      name: '東北',
      code: '02',
      kanaName: 'とうほく',
      status: 'published',
      kanaEn: 'tohoku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    } satisfies ReconstituteRegionProps),
    Region.reconstitute({
      // id: '0324dc98-89a2-4db1-9431-b20feff57700',
      name: '関東',
      code: '03',
      kanaName: 'kanto',
      status: 'published',
      kanaEn: 'kantou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    } satisfies ReconstituteRegionProps),
    Region.reconstitute({
      // id: '0424dc98-89a2-4db1-9431-b20feff57700',
      name: '東海',
      code: '04',
      kanaName: 'とうかい',
      status: 'published',
      kanaEn: 'tokai',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    } satisfies ReconstituteRegionProps),
    Region.reconstitute({
      // id: '0524dc98-89a2-4db1-9431-b20feff57700',
      name: '北陸',
      code: '05',
      kanaName: 'ほくりく',
      status: 'published',
      kanaEn: 'hokuriku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
    } satisfies ReconstituteRegionProps),
  ];

  const ids = [
    'b96509f2-0ba4-447c-8a98-473aa26e457a',
    'ad24dc98-89a2-4db1-9431-b20feff57700',
    '0324dc98-89a2-4db1-9431-b20feff57700',
    '0424dc98-89a2-4db1-9431-b20feff57700',
    '0524dc98-89a2-4db1-9431-b20feff57700',
  ];

  const mockDatas: (Region & { id: string })[] = regions.map((region, index) =>
    Object.assign(region, { id: ids[index] }),
  );

  return mockDatas;
}

/**
 * 期待値作成
 *
 * memo:
 * mockDataの型指定(Region & { id: string })[]は不要（というかRegionはプレーンオブジェクト
 * ではないので型指定すると不一致エラーが出てしまうので、削除。
 * → 現状は期待値としてプレーンオブジェクトにしている。これは自作のRegionのreconstitube()を
 *   使用して期待値を作ってしまうとテストの信頼性が下がってしまうから。
 *
 * @returns 期待値
 */
function createExpectedData() {
  // mockDataの型指定(Region & { id: string })[]は不要（というかRegionはプレーンオブジェクト
  // ではないので型指定すると不一致エラーが出てしまう。
  const expectedData = [
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
  return expectedData;
}
