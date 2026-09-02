import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Region as PrismaRegion } from '../../../generated/prisma';
import { PAGINATION } from '../../common/constants/pagination.constants';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
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
import { RegionFilter } from './region.filter';
import { RegionsQueryService } from './regions.query.service';

// MockService定義
const mockPrismaService = {
  region: {
    findMany: jest.fn(),
    count: jest.fn(),
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
  // 実際のregions.query.service.tsでは、ConfigServiceは個別(regions.module.ts)で
  // importsしていない。app.module.tsにてグローバルでDI定義している。が、UTで必要なので。
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let configService: ConfigService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    const module = await Test.createTestingModule({
      providers: [
        RegionsQueryService,
        ConfigService,
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
    configService = module.get<ConfigService>(ConfigService);
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
  // modkData:
  // ①Prisma findMany
  // ②Prisma count
  describe('findAll', () => {
    it('正常系：ReadMdel配列(全項目)が返却されること(dtoは全て@Expose()がセットされている) - (filter無し)', async () => {
      // prisma mock data 作成: findMany
      const mockDatas = createPrismaMockData();
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue(mockDatas);

      // prisma mock data 作成: count
      const count = 5;
      jest.spyOn(prismaService.region, 'count').mockResolvedValue(count);

      // テスト対象Service呼び出し
      const filters = {} satisfies RegionFilter;
      const result = await regionsQueryService.findAll(filters);

      // 検証
      const dtos = createExpectedPaginatedResult();
      expect(result).toEqual(dtos);

      // prisma引数検証 → 引数なしなので不要
      // expect(jest.spyOn(prismaService.region, 'findMany')).toHaveBeenCalledWith(
      //   {
      //     include: { _count: { select: { prefectures: true } } },
      //     orderBy: { code: 'asc' },
      //   },
      // );
    });

    it('Promise.all が正しく並列で呼ばれていることを確認', async () => {
      // mock data 作成 （なんでもいい)
      jest
        .spyOn(prismaService.region, 'findMany')
        .mockResolvedValue(createPrismaMockData());
      jest.spyOn(prismaService.region, 'count').mockResolvedValue(5);

      // テスト対象のservice呼び出し（結果を取得しない)
      const filters = {} satisfies RegionFilter;
      await regionsQueryService.findAll(filters);

      // Promise.allが呼ばれた証拠として、両方が呼ばれていることを確認
      expect(
        jest.spyOn(prismaService.region, 'findMany'),
      ).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(prismaService.region, 'count')).toHaveBeenCalledTimes(
        1,
      );
    });

    /**
     * findAllの絞り込み(filter)テストは、toEqual()の検証ではなく、toHaveBeenCalledWithを
     * 用いて、Prismaが期待通りの引数で呼び出されているかをメインに検証する。
     *
     * Prismaはmockしているので、返却値はmockでセットされるため、レスポンス(Prisma/service)を
     * toEqual()にて検証しても意味がない。
     *
     * ＜テスト観点＞
     * serviceクラスの引数(filters)によって、どのようにPrismaのwhere句などの条件が
     * 変更されるか期待値との検証を行う。
     * 従って、mockResolvedValue()でセットするPrismaのmock dataは、何でもいい。
     *
     * toHaveBeenCalledWith()に渡された引数と期待値が合うか。
     *  重要ポイント：PrismaService.region.findMany()はMock化するが、findMany()は「誰が、
     *  どんな引数で呼んだか」を記録してくれているので、モックでも「実際に渡された引数」で「実際の
     *  PrismaService.findManyの引数(型、値)」で渡されているかチェックするという強力なツール!!
     *
     *  例：  expect(prismaService.fegion, 'findMany').toHaveBeenCalledWith({
     *         where: {
     *          status: StoreStatus.PUBLISHED,
     *          // 他のプロパティが undefined であることも含めてチェックされる ← 何気にこれ重要!!
     *         },
     *       });
     */
    describe('findAllの絞り込み(filter)テスト', () => {
      it('正常系(1): codeを指定した場合、prismaのwhere句に正しく反映されること。', async () => {
        // 引数
        const filters = { code: '01' } satisfies RegionFilter;

        // mock data 作成 （mockデータなので、実際に絞り込まれている必要はない）
        // const prismaRegion = createPrismaMockData().find(
        //   (region) => region.code === filters.code,
        // );

        // mock data set (spyOnを使わないパターン)
        mockPrismaService.region.findMany.mockResolvedValue(
          createPrismaMockData(),
        );
        mockPrismaService.region.count.mockResolvedValue(5);

        // test対象 service 呼び出し(結果を取得しない)
        await regionsQueryService.findAll(filters);

        // 検証： prisma の where句
        expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
          include: { _count: { select: { prefectures: true } } },
          where: { code: '01' },
          orderBy: { code: 'asc' },
          take: 20,
          skip: 0,
        });
        expect(mockPrismaService.region.count).toHaveBeenCalledWith({
          where: { code: '01' },
        });
      });

      it('正常系(2): nameを指定した場合、prismaのwhere句に正しく反映されること。', async () => {
        // 引数
        const filters = { name: '関東' } satisfies RegionFilter;

        // mock data set （mockデータなので、実際に絞り込まれている必要はない）
        mockPrismaService.region.findMany.mockResolvedValue(
          createPrismaMockData(),
        );
        mockPrismaService.region.count.mockResolvedValue(5);

        // test対象 service 呼び出し(結果を取得しない)
        await regionsQueryService.findAll(filters);

        // 検証： prisma の where句
        expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
          include: { _count: { select: { prefectures: true } } },
          where: { name: { contains: '関東' } },
          orderBy: { code: 'asc' },
          take: 20,
          skip: 0,
        });
        expect(mockPrismaService.region.count).toHaveBeenCalledWith({
          where: { name: { contains: '関東' } },
        });
      });

      it('正常系(3): statusを指定した場合、prismaのwhere句に正しく反映されること。', async () => {
        // 引数
        const filters = { status: 'editing' } satisfies RegionFilter;

        // mock data set （mockデータなので、実際に絞り込まれている必要はない）
        mockPrismaService.region.findMany.mockResolvedValue(
          createPrismaMockData(),
        );
        mockPrismaService.region.count.mockResolvedValue(5);

        // test対象 service 呼び出し(結果を取得しない)
        await regionsQueryService.findAll(filters);

        // 検証： prisma の where句
        expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
          include: { _count: { select: { prefectures: true } } },
          where: { status: 'editing' },
          orderBy: { code: 'asc' },
          take: 20,
          skip: 0,
        });
        expect(mockPrismaService.region.count).toHaveBeenCalledWith({
          where: { status: 'editing' },
        });
      });
    });

    describe('findAllの絞り込み(filter) 複合条件のテスト', () => {
      it('(1)+(2)+(3)が指定された場合、正しくwhereコードのwhere句が組み立てられること', async () => {
        // 引数
        const filters = {
          code: '01',
          name: '北海道',
          status: 'editing',
        } satisfies RegionFilter;

        // prisma modk data (なんでもいい)
        mockPrismaService.region.findMany.mockResolvedValue(
          createPrismaMockData(),
        );

        // seavice 呼び出し
        await regionsQueryService.findAll(filters);

        // prisma(findManay) の パラメータ(where) 検証
        expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
          include: { _count: { select: { prefectures: true } } },
          where: {
            code: filters.code,
            name: { contains: filters.name },
            status: filters.status,
          },
          orderBy: { code: 'asc' },
          take: 20,
          skip: 0,
        });
        // prisma(findManay) の パラメータ(count) 検証
        expect(mockPrismaService.region.count).toHaveBeenCalledWith({
          where: {
            code: filters.code,
            name: { contains: filters.name },
            status: filters.status,
          },
        });
      });
    });

    describe('findAllのページネーションテスト', () => {
      describe('sizeパラメータの境界値テスト', () => {
        // memo: it.each([...])はbeforeEachより前(テストスイート組み立てフェーズ)に評価されるため、
        // it.each内でconfigServiceなど、DIされたモジュールを呼び出すとundefinedになる。
        // なので期待値の.envファイル読み込みは行わず、直書きする(prefectures.service.spec.tsに準拠)。
        it.each([
          {
            testCase: 'size未指定',
            note: 'デフォルト値がセットされること',
            filters: { size: undefined } satisfies RegionFilter,
            expectedParam: 20,
          },
          {
            testCase: 'sizeがマイナス値',
            note: 'sizeにMIN_PAGE_SIZEがセットされること',
            filters: { size: -1 } satisfies RegionFilter,
            expectedParam: PAGINATION.MIN_PAGE_SIZE,
          },
          {
            testCase: 'sizeが0',
            note: 'sizeにMIN_PAGE_SIZEがセットされること',
            filters: { size: 0 } satisfies RegionFilter,
            expectedParam: PAGINATION.MIN_PAGE_SIZE,
          },
          {
            testCase: 'sizeが1(下限値)',
            filters: { size: 1 } satisfies RegionFilter,
            expectedParam: PAGINATION.MIN_PAGE_SIZE,
          },
          {
            testCase: 'sizeが正常値',
            filters: { size: 5 } satisfies RegionFilter,
            expectedParam: 5,
          },
          {
            testCase: 'sizeの上限値',
            filters: { size: PAGINATION.MAX_PAGE_SIZE } satisfies RegionFilter,
            expectedParam: PAGINATION.MAX_PAGE_SIZE,
          },
          {
            testCase: 'sizeの上限値超過',
            note: 'sizeの上限値がセットされること',
            filters: {
              size: PAGINATION.MAX_PAGE_SIZE + 1,
            } satisfies RegionFilter,
            expectedParam: PAGINATION.MAX_PAGE_SIZE,
          },
        ])(
          '$testCase の場合、takeに正しく値が反映されること ($note)',
          async ({ filters, expectedParam }) => {
            // mock data (なんでもいい)
            mockPrismaService.region.findMany.mockResolvedValue(
              createPrismaMockData(),
            );
            mockPrismaService.region.count.mockResolvedValue(5);

            // test対象呼び出し：結果は取得しない
            await regionsQueryService.findAll(filters);

            // 検証： 期待通りtakeが渡されているか
            expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
              include: { _count: { select: { prefectures: true } } },
              where: {},
              orderBy: { code: 'asc' },
              take: expectedParam,
              skip: 0,
            });
          },
        );
      });

      describe('pageパラメータの境界値テスト: skipの算出ロジックテスト', () => {
        it.each([
          {
            testCase: 'page未指定',
            note: 'skipに0がセットされること',
            filters: { page: undefined } satisfies RegionFilter,
            expectedParam: 0,
          },
          {
            testCase: 'pageがマイナス値',
            note: 'skipに0がセットされること',
            filters: { page: -1 } satisfies RegionFilter,
            expectedParam: 0,
          },
          {
            testCase: 'pageが0',
            note: 'skipに0がセットされること',
            filters: { page: 0 } satisfies RegionFilter,
            expectedParam: 0,
          },
          {
            testCase: 'pageが1(下限値)',
            filters: { page: 1 } satisfies RegionFilter,
            expectedParam: 0,
          },
          {
            testCase: 'pageが正常値(2ページ目)',
            filters: { page: 2 } satisfies RegionFilter,
            expectedParam: 20,
          },
          {
            testCase: 'pageの上限値超過',
            note: 'pageの上限値がセットされること',
            filters: {
              page: PAGINATION.MAX_PAGE + 1,
            } satisfies RegionFilter,
            expectedParam: (PAGINATION.MAX_PAGE - 1) * 20,
          },
        ])(
          '$testCase の場合、skipに正しく値が反映されること ($note)',
          async ({ filters, expectedParam }) => {
            // mock data (なんでもいい)
            mockPrismaService.region.findMany.mockResolvedValue(
              createPrismaMockData(),
            );
            mockPrismaService.region.count.mockResolvedValue(20);

            // test対象呼び出し：結果は取得しない
            await regionsQueryService.findAll(filters);

            // 検証： 期待通りskipが渡されているか
            expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
              include: { _count: { select: { prefectures: true } } },
              where: {},
              orderBy: { code: 'asc' },
              take: 20,
              skip: expectedParam,
            });
          },
        );
      });

      it('正常系: size・page指定時、戻り値のmeta.page/meta.sizeが実際に使われた値と一致すること', async () => {
        // mock data
        mockPrismaService.region.findMany.mockResolvedValue(
          createPrismaMockData(),
        );
        mockPrismaService.region.count.mockResolvedValue(42);

        // 引数
        const filters = { page: 3, size: 5 } satisfies RegionFilter;

        // test対象呼び出し
        const result = await regionsQueryService.findAll(filters);

        // 検証: Prisma呼び出しへの反映
        expect(mockPrismaService.region.findMany).toHaveBeenCalledWith({
          include: { _count: { select: { prefectures: true } } },
          where: {},
          orderBy: { code: 'asc' },
          take: 5,
          skip: 10,
        });

        // 検証: レスポンスのmetaが実際に使われたpage/sizeと一致すること
        expect(result.meta).toEqual({
          totalCount: 42,
          page: 3,
          size: 5,
        });
      });
    });

    it('正常系：取得データが０件、dto[]の空配列が返却される', async () => {
      // mock data 作成(空配列)
      jest.spyOn(prismaService.region, 'findMany').mockResolvedValue([]);
      // 0件
      jest.spyOn(prismaService.region, 'count').mockResolvedValue(0);

      // test対象Controller呼び出し
      const filters = {} satisfies RegionFilter;
      const result = await regionsQueryService.findAll(filters);

      // 期待値: PaginatedResult (空配列と0件)
      const paginatedExpect = {
        // 空配列
        data: [],
        meta: {
          // 0件
          totalCount: 0,
          page: 1,
          size: 20,
        },
      } satisfies PaginatedResult<RegionListReadModel>;

      // 検証：
      expect(result).toEqual(paginatedExpect);
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
 * 期待値：Region List Read Model (PaginatedResult) [] 作成 ※findAll()用
 *
 * @returns Region List Read Model []
 */
function createExpectedPaginatedResult(): PaginatedResult<RegionListReadModel> {
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

  // ページネーション化
  const paginated = {
    data: readModels,
    meta: {
      totalCount: 5,
      page: 1,
      size: 20,
    },
  } satisfies PaginatedResult<RegionListReadModel>;

  return paginated;
}
