import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Region as PrismaRegion } from '../../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  REGION_REPOSITORY_PORT,
  RegionRepositoryPort,
} from '../domain/region.repository.port';
import {
  ReconstituteRegionProps,
  Region,
  RegionState,
} from '../domain/regions.model';
import { RegionDetailReadModel } from './region-detail.read-model';
import { RegionListReadModel } from './region-list.read-model';
import { RegionsQueryService } from './regions.query.service';

// MockService定義
const mockPrismaService = {
  region: {
    findMany: jest.fn(),
    // create: jest.fn(),
    findUnique: jest.fn(),
    // update: jest.fn(),
    // upsert: jest.fn(),
  },
};

// MockRepository定義
const mockRegionRepository = {
  findByIdOrFail: jest.fn(),
  findByCodeOrFail: jest.fn(),
  save: jest.fn(),
} as jest.Mocked<RegionRepositoryPort>; // as jest.Mocked<>はなくてもいいが、型安全に

describe('■■■ Region Query Service test ■■■', () => {
  // DIモジュール
  let regionsQueryService: RegionsQueryService;
  let regionRepository: RegionRepositoryPort;
  let prismaService: PrismaService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    const module = await Test.createTestingModule({
      providers: [
        RegionsQueryService,
        { provide: PrismaService, useValue: mockPrismaService },
        // Repositoryはinterfaceを実装しているのでtoken(=REGION_REPOSITORY_PORT)で指定
        {
          provide: REGION_REPOSITORY_PORT,
          useValue: mockRegionRepository,
        },
      ],
    }).compile();

    regionsQueryService = module.get<RegionsQueryService>(RegionsQueryService);
    prismaService = module.get<PrismaService>(PrismaService);
    regionRepository = module.get<RegionRepositoryPort>(REGION_REPOSITORY_PORT);
  });

  // 前処理: 各テストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    // jest.clearAllMocks();
    jest.resetAllMocks();
  });

  //--------------------------------------
  // findAll() test
  //--------------------------------------
  describe('findAll', () => {
    it('正常系：dto配列(全項目)が返却される(dtoは全て@Expose()がセットされている', async () => {
      // prisma mock data 作成
      const mockDatas = createPrismaMockData();
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue(mockDatas);

      // テスト対象Service呼び出し
      const result = await regionsQueryService.findAll();

      // 検証
      const dtos = createExpectedReadModels();
      expect(result).toEqual(dtos);

      // prisma引数検証 → 引数なしなので不要
      // expect(jest.spyOn(prismaService.region, 'findMany')).toHaveBeenCalledWith(
      //   {
      //     include: { _count: { select: { prefectures: true } } },
      //     orderBy: { code: 'asc' },
      //   },
      // );
    });

    it('正常系：取得データが０件、dto[]の空配列が返却される', async () => {
      // mock data 作成(空配列)
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue([]);
      // test対象Controller呼び出し
      const result = await regionsQueryService.findAll();
      // 検証：plainToInstance()は空配列が渡ってきた場合、空配列を返す
      expect(result).toEqual([]);
    });

    it('異常系(カバレッジ100%のため)： DB接続エラー', async () => {
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest
        .spyOn(prismaService.region, 'findMany')
        .mockRejectedValue(connectionError);

      // Query Serviceがエラーをそのまま伝播（reject）することを確認
      await expect(regionsQueryService.findAll()).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });
  });

  //--------------------------------------
  // findOne() test
  //--------------------------------------
  describe('findOne Test', () => {
    it('正常系： 指定idに関連するRegionドメイン(＋id)(全項目)を返却する', async () => {
      // Repository mock data 作成
      // Region & {id:string} の生成は本物のRegion.reconstitute()を使う（BP)
      const mockRegion = Region.reconstitute({
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies ReconstituteRegionProps) satisfies Region;
      const regionWithId = Object.assign(mockRegion, {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      });

      // mock data set (Repository)
      jest
        .spyOn(regionRepository, 'findByIdOrFail')
        .mockResolvedValue(regionWithId);

      //  jest.spyOn は「本物のメソッドを監視・上書きしたいとき」に使うため、本来は以下のように
      //  直接mockに対してmockresolvedValue()するのが主流のよう。
      //  これからはspyOn()をやめてみよう。。
      mockRegionRepository.findByIdOrFail.mockResolvedValue(regionWithId);

      // serviceの引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a';

      // テスト対象 service 呼び出し
      const result = await regionsQueryService.findOne(id);

      // 検証: RegionドメインのtoEqual()の検証はしない（domainはプレーンオブジェクトではないため）
      // mockDataの型指定(Region & { id: string })は不要（というかRegionはプレーンオブジェクト
      // ではないので型指定すると不一致エラーが出てしまうので、RegionStateというRegion domain 全属性を
      // 使用している。
      expect(result).toMatchObject({
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies RegionState & { id: string });

      // 引数チェック
      expect(
        jest.spyOn(regionRepository, 'findByIdOrFail'),
      ).toHaveBeenCalledWith(id);
    });

    it('異常系①： 指定idに関連するRegion情報が存在しないので、NotFoundExceptionがスローされる', async () => {
      // serviceの引数作成
      const id = 'xxxx';

      // mock data 作成(Repository): Regionが存在しない
      const mockException = new NotFoundException(
        `idに関連するエリア情報が存在しません!! regionId: ${id}`,
      );
      jest
        .spyOn(regionRepository, 'findByIdOrFail')
        .mockRejectedValue(mockException);

      // 検証：NotFoundException
      await expect(regionsQueryService.findOne(id)).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
      );
    });

    it('異常系②： Retion情報の更新時のエラー（DB接続エラー)', async () => {
      // serviceの引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a';

      // DB接続エラー
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );

      // mock data set (Error)
      jest
        .spyOn(regionRepository, 'findByIdOrFail')
        .mockRejectedValue(connectionError);

      // 検証: エラーをそのまま伝搬することを確認
      await expect(regionsQueryService.findOne(id)).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });
  });

  //--------------------------------------
  // findByCodeOrFail() test
  //--------------------------------------
  describe('findByCodeOrFail', () => {
    it('正常系： 指定codeのRegion domain(全項目)を返却する', async () => {
      // serviceの引数
      const code = '02';

      // Repository mock data 作成
      // Region & {id:string} の生成は本物のRegion.reconstitute()を使う（BP)
      const mockRegion = Region.reconstitute({
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies ReconstituteRegionProps) satisfies Region;
      const regionWithId = Object.assign(mockRegion, {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      });

      // mock data set (Repository)
      jest
        .spyOn(regionRepository, 'findByCodeOrFail')
        .mockResolvedValue(regionWithId);

      // test対象service呼び出し
      const result = await regionsQueryService.findByCodeOrFail(code);

      // 検証:
      // expect(result).toEqual(expected);
      // 検証：プロパティをすべて持っているか、プロパティ値が正しいか
      // RegionドメインのtoEqual()の検証はしない（domainはプレーンオブジェクトではないため）
      // mockDataの型指定(Region & { id: string })は不要（というかRegionはプレーンオブジェクト
      // ではないので型指定すると不一致エラーが出てしまうので、RegionStateというRegion domain 全属性を
      // 使用している。
      expect(result).toMatchObject({
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies RegionState & { id: string });

      // service→regionRepository.findByCodeOrFail()への引数の検証
      expect(
        jest.spyOn(regionRepository, 'findByCodeOrFail'),
      ).toHaveBeenCalledWith(code);
    });

    it('異常系： codeに関連するエリア情報が存在しない場合、NotFoundExcepton(エラーの伝搬確認)', async () => {
      // serviceの引数
      const code = '99';

      // repositoryにException(期待値)をセット
      const mockException = new NotFoundException(
        `codeに関連するエリア情報が存在しません!! code: ${code}`,
      );
      jest
        .spyOn(regionRepository, 'findByCodeOrFail')
        .mockRejectedValue(mockException);

      // 検証
      await expect(regionsQueryService.findByCodeOrFail(code)).rejects.toThrow(
        new NotFoundException(
          `codeに関連するエリア情報が存在しません!! code: ${code}`,
        ),
      );
    });
  });

  //--------------------------------------
  // getDetailByIdOrThrow() test
  //--------------------------------------
  describe('getDetailByIdOrThrow', () => {
    it('正常系: idに関連するReadModel(全項目)を返却する', async () => {
      // 引数
      const id = 'ad24dc98-89a2-4db1-9431-b20feff57700';

      // prisma mock data set
      mockPrismaService.region.findUnique.mockResolvedValue(
        createPrismaMockData().find((region) => region.id === id),
      );

      // test 対象 Query Service 呼び出し
      const result = await regionsQueryService.getDetailByIdOrThrow(id);

      // 検証
      expect(result).toEqual({
        id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
        name: '東北',
        code: '02',
        kanaName: 'とうほく',
        status: 'published',
        kanaEn: 'tohoku',
        prefectureCount: 2,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies RegionDetailReadModel);
    });

    it('異常系: 指定idに関連するRegion情報が存在しないので、NotFoundExceptionがスローされる', async () => {
      // 引数
      const id = 'xxxxxxx';

      // prisma mock data set : Regionが存在しない
      mockPrismaService.region.findUnique.mockResolvedValue(null);

      // Exception検証（①NotFoundExceptionの検証 ②メッセージの検証）のやり方より以下のように
      // 一発で検証するやり方がBP。
      await expect(
        regionsQueryService.getDetailByIdOrThrow(id),
      ).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
      );
    });

    it('異常系(エラーの伝搬)： DB接続エラー', async () => {
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest
        .spyOn(prismaService.region, 'findUnique')
        .mockRejectedValue(connectionError);

      // 引数
      const id = 'ad24dc98-89a2-4db1-9431-b20feff57700';

      // Query Serviceがエラーをそのまま伝播（reject）することを確認
      await expect(
        regionsQueryService.getDetailByIdOrThrow(id),
      ).rejects.toThrow(PrismaClientKnownRequestError);
    });
  });

  //--------------------------------------
  // getDetailByCodeOrThrow() test
  //--------------------------------------
  describe('getDetailByCodeOrThrow', () => {
    it('正常系: codeに関連するReadModel(全項目)を返却する', async () => {
      // 引数
      const code = '03';

      // prisma mock data set
      mockPrismaService.region.findUnique.mockResolvedValue(
        createPrismaMockData().find((region) => region.code === code),
      );

      // test 対象 Query Service 呼び出し
      const result = await regionsQueryService.getDetailByCodeOrThrow(code);

      // 検証
      expect(result).toEqual({
        id: '0324dc98-89a2-4db1-9431-b20feff57700',
        name: '関東',
        code: '03',
        kanaName: 'かんとう',
        status: 'published',
        kanaEn: 'kantou',
        prefectureCount: 3,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies RegionDetailReadModel);
    });

    it('異常系: 指定codeに関連するRegion情報が存在しないので、NotFoundExceptionがスローされる', async () => {
      // 引数
      const code = 'xx';

      // prisma mock data set : Regionが存在しない
      mockPrismaService.region.findUnique.mockResolvedValue(null);

      // Exception検証（①NotFoundExceptionの検証 ②メッセージの検証）のやり方より以下のように
      // 一発で検証するやり方がBP。
      await expect(
        regionsQueryService.getDetailByCodeOrThrow(code),
      ).rejects.toThrow(
        new NotFoundException(
          `codeに関連するエリア情報が存在しません!! regionCode: ${code}`,
        ),
      );
    });

    it('異常系(エラーの伝搬)： DB接続エラー', async () => {
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest
        .spyOn(prismaService.region, 'findUnique')
        .mockRejectedValue(connectionError);

      // 引数
      const code = '01';

      // Query Serviceがエラーをそのまま伝播（reject）することを確認
      await expect(
        regionsQueryService.getDetailByIdOrThrow(code),
      ).rejects.toThrow(PrismaClientKnownRequestError);
    });
  });
});

/**
 * Prisma Mock Data作成
 * @returns Prisma Mock Data
 */
function createPrismaMockData(): (PrismaRegion & {
  _count: { prefectures: number };
})[] {
  const mockDatas: (PrismaRegion & { _count: { prefectures: number } })[] = [
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
      _count: { prefectures: 1 },
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
      _count: { prefectures: 2 },
    },
    {
      id: '0324dc98-89a2-4db1-9431-b20feff57700',
      name: '関東',
      code: '03',
      kanaName: 'かんとう',
      status: 'published',
      kanaEn: 'kantou',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      _count: { prefectures: 3 },
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
      _count: { prefectures: 4 },
    },
    {
      id: '0524dc98-89a2-4db1-9431-b20feff57700',
      name: '北陸',
      code: '05',
      kanaName: 'ほくりく',
      status: 'editing',
      kanaEn: 'hokuriku',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      _count: { prefectures: 5 },
    },
  ];
  return mockDatas;
}

/**
 * 期待値：Region List Read Model [] 作成 ※findAll()用
 *
 * @returns Region List Read Model []
 */
function createExpectedReadModels(): RegionListReadModel[] {
  const readModels: RegionListReadModel[] = [
    {
      id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      name: '北海道',
      code: '01',
      kanaName: 'ほっかいどう',
      status: 'published',
      kanaEn: 'hokkaidou',
      prefectureCount: 1,
    } satisfies RegionListReadModel,
    {
      id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
      name: '東北',
      code: '02',
      kanaName: 'とうほく',
      status: 'published',
      kanaEn: 'tohoku',
      prefectureCount: 2,
    } satisfies RegionListReadModel,
    {
      id: '0324dc98-89a2-4db1-9431-b20feff57700',
      name: '関東',
      code: '03',
      kanaName: 'かんとう',
      status: 'published',
      kanaEn: 'kantou',
      prefectureCount: 3,
    } satisfies RegionListReadModel,
    {
      id: '0424dc98-89a2-4db1-9431-b20feff57700',
      name: '東海',
      code: '04',
      kanaName: 'とうかい',
      status: 'published',
      kanaEn: 'tokai',
      prefectureCount: 4,
    } satisfies RegionListReadModel,
    {
      id: '0524dc98-89a2-4db1-9431-b20feff57700',
      name: '北陸',
      code: '05',
      kanaName: 'ほくりく',
      status: 'editing',
      kanaEn: 'hokuriku',
      prefectureCount: 5,
    } satisfies RegionListReadModel,
  ];

  return readModels;
}
