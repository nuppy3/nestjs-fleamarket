import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Region as PrismaRegion } from '../../generated/prisma';
import { PrismaService } from './../prisma/prisma.service';
import {
  ReconstituteRegionProps,
  Region,
  RegionStatus,
} from './domain/regions.model';
import { CreateRegionDto } from './dto/region.dto';
import { RegionRepository } from './infrastructure/region.repository';
import { RegionsService } from './regions.service';

// MockService定義
const mockPrismaSercie = {
  region: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

// MockRepository定義
const mockRegionRepository = {
  findByIdOrFail: jest.fn(),
};

describe('■■■ Region test ■■■', () => {
  // DIモジュール
  let regionsService: RegionsService;
  let prismaService: PrismaService;
  let regionRepository: RegionRepository;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [RegionsController],
    //   providers: [RegionsService, RegionRepository],
    // })

    const module = await Test.createTestingModule({
      providers: [
        RegionsService,
        { provide: PrismaService, useValue: mockPrismaSercie },
        { provide: RegionRepository, useValue: mockRegionRepository },
      ],
    }).compile();

    regionsService = module.get<RegionsService>(RegionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    regionRepository = module.get<RegionRepository>(RegionRepository);
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

  //--------------------------------------
  // findByCodeOrFail() test
  //--------------------------------------
  describe('findByCodeOrFail', () => {
    it('正常系： 指定codeのRegion domain(全項目)を返却する', async () => {
      // serviceの引数
      const code = '02';

      // prisma mock data 作成
      const mockPrismaData = createPrismaMockData().find(
        (region) => region.code === code,
      );
      jest
        .spyOn(prismaService.region, 'findUnique')
        .mockResolvedValue(mockPrismaData!);

      // test対象service呼び出し
      const result = await regionsService.findByCodeOrFail(code);

      // 期待値
      const expected = createExpectedData().find(
        (region) => region.code === code,
      );

      // 検証
      // expect(result).toEqual(expected);
      // 検証：プロパティをすべて持っているか、プロパティ値が正しいか
      expect(result).toMatchObject(expected!);

      // service→prismaService.region.findUnique()への引数の検証
      expect(
        jest.spyOn(prismaService.region, 'findUnique'),
      ).toHaveBeenCalledWith({ where: { code } });
    });

    it('異常系： codeに関連するエリア情報が存在しない場合、NotFoundExcepton', async () => {
      // mock data 作成（prismaは０件の場合、nullを返す)
      jest.spyOn(prismaService.region, 'findUnique').mockResolvedValue(null);

      // 検証
      const code = '13';
      await expect(regionsService.findByCodeOrFail(code)).rejects.toThrow(
        new NotFoundException(
          `codeに関連するエリア情報が存在しません!! code: ${code}`,
        ),
      );
    });
  });

  //--------------------------------------
  // create test
  //--------------------------------------
  describe('create', () => {
    // 共通引数：ユーザーID
    const userId = '633931d5-2b25-45f1-8006-c137af49e53d';

    it('正常系： Region情報を登録(全項目)し、Regionドメイン(＋id)を返却する', async () => {
      // servic 引数 (dto) 作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // prisma mock data 作成
      const prismaMockData = {
        id: '106509f2-0ba4-447c-8a98-473aa26e457a',
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: 'published',
        kanaEn: 'okinawa',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      } satisfies PrismaRegion;

      jest
        .spyOn(prismaService.region, 'create')
        .mockResolvedValue(prismaMockData);

      // テスト対象service呼び出し
      const result = await regionsService.create(dto, userId);

      // 期待値
      // Regionドメインのカプセル化(getter()など追加)のため、プレーンなオブジェクトではないため
      // satisfiesでの型チェックはできないし、しない。
      const expectedData = {
        id: '106509f2-0ba4-447c-8a98-473aa26e457a',
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: 'published',
        kanaEn: 'okinawa',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        // } satisfies Region & { id: string };
      };

      // 検証
      // Regionを完全カプセル化したことにより、getterなどのfunctionが含まれているので
      // toEqualでの完全一致比較だとNGになる。
      // → objectContaining()にてプレーンなオブジェクトでの比較検証を行うのが定石
      // expect(result).toEqual(expectedData);
      expect(result).toEqual(expect.objectContaining(expectedData));
      // ちなみに、以下でもプレーンオブエクト（プロパティとその値のみチェック）の判定が可能であり
      // 上記とほぼ同じらしい。のでどちらか一方の検証をすればOK
      expect(result).toMatchObject(expectedData);
    });

    // 任意項目なし
    it('正常系： Region情報を登録(任意項目除外)し、Regionドメインを返却する', () => {
      // servic 引数 作成
      // prisma mock data 作成
      // テスト対象service呼び出し
      // 検証
    });

    // 任意項目なし
    it('正常系： Region情報を登録(任意項目をundefined)し、Regionドメインを返却する', () => {
      // servic 引数 作成
      // prisma mock data 作成
      // テスト対象service呼び出し
      // 検証
    });

    //--------------------
    // エラーケースのテスト
    //--------------------
    it('異常系①： Region情報を登録(全項目)し、一意制約(P2002)が発生', async () => {
      // servic 引数 (dto) 作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // prisma P2002 error mock data 作成
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
      // Errorを返却させたい場合はmockRejectedValue()でcreateのPrisma<Region & {id:string}>の
      // 返却をアンラップして、Errorを返すようにする）
      jest
        .spyOn(prismaService.region, 'create')
        .mockRejectedValue(mockP2002Error);

      // テスト対象service呼び出し、検証
      // ConflictExceptionがスローされることをテスト
      await expect(regionsService.create(dto, userId)).rejects.toThrow(
        ConflictException,
      );

      // ConflictExceptionのmessage 検証
      await expect(regionsService.create(dto, userId)).rejects.toThrow(
        '指定された code は既に存在します。',
      );
    });

    it('異常系②： 一意制約(P2002)以外のPrismaエラーが発生した場合、そのまま元のエラーを伝搬(スロー)する', async () => {
      // servic 引数 (dto) 作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // prisma P2000(P2002以外のエラー) error mock data 作成
      const mockP2000Error = new PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`code`)',
        {
          code: 'P2000',
          clientVersion: 'test-version',
        },
      );

      // prismaServiceのmock(Error)を設定
      jest
        .spyOn(prismaService.region, 'create')
        .mockRejectedValue(mockP2000Error);

      // テスト対象service呼び出し、結果を検証
      await expect(regionsService.create(dto, userId)).rejects.toThrow(
        PrismaClientKnownRequestError,
      );

      // Errorに以下が含まれることを検証（このテストはなくてもいいか）
      // await expect(regionsService.create(dto)).rejects.toHaveProperty(
      //   'code',
      //   'P2000',
      // );
    });

    it('異常系③： その他エラーのテスト: 元のエラーをそのまま伝搬(スロー)する', async () => {
      // servic 引数 (dto) 作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // PrismaClientKnownRequestError以外の一般エラーを作成
      const mockGenericError = new Error('Database connection failed');

      // モックの実装: create()が一般のエラーを投げるように設定
      jest
        .spyOn(prismaService.region, 'create')
        .mockRejectedValue(mockGenericError);

      // 元のエラー（Generic Error）がそのまま再スローされることをテスト
      await expect(regionsService.create(dto, userId)).rejects.toThrow(Error);
      await expect(regionsService.create(dto, userId)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  //--------------------------------------
  // remove() test
  //--------------------------------------
  describe('remove Test', () => {
    it('正常系： 指定idに関連するRegion情報が削除され、Regionドメイン(＋id)(全項目)を返却する', async () => {
      // TODO 以下はRegionRepositoryのUTにて実施 --------------

      // // prisma region 'findUnique' mock data
      // const mockPrismaRegion = {
      //   id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      //   name: '北海道',
      //   code: '01',
      //   kanaName: 'ほっかいどう',
      //   status: 'published',
      //   kanaEn: 'hokkaidou',
      //   createdAt: new Date('2025-04-05T10:00:00.000Z'),
      //   updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      //   userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      // } satisfies PrismaRegion;

      // jest
      //   .spyOn(prismaService.region, 'findUnique')
      //   .mockResolvedValue(mockPrismaRegion);

      // TODO RegionRepositoryのUTにて実施 --------------

      // Repository mock data 作成
      // Region & {id:string} の生成は本物のRegion.Reconstiture()を使う（BP)
      // Region は「ドメインモデル」であり、外部依存（DBやAPI）を持たない純粋なロジックのかたまりです。これを Mock にしてしまうと、
      // テストコードが非常に複雑になる割にメリットがありません。
      const mockRegion = Region.reconstitute({
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      }) satisfies ReconstituteRegionProps;
      const regionWithId = Object.assign(mockRegion, {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      });

      // mock data set (Repository)
      jest
        .spyOn(regionRepository, 'findByIdOrFail')
        .mockResolvedValue(regionWithId);

      // prisma region 'update' mock data
      const mockDeleted = {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      } satisfies PrismaRegion;

      jest.spyOn(prismaService.region, 'update').mockResolvedValue(mockDeleted);

      // serviceの引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a';
      const userId = '633931d5-2b25-45f1-8006-c137af49e53d';

      // テスト対象 service 呼び出し
      const result = await regionsService.remove(id, userId);

      // 検証: RegionドメインのtoEqual()の検証はしない（domainはプレーンオブジェクトではないため）
      // expect(result).toEqual(
      //   createExpectedData().find((region) => region.id === id),
      // );
      // 検証：プロパティをすべて持っているか、プロパティ値が正しいか
      expect(result).toMatchObject(
        createExpectedData().find((region) => region.id === id)!,
      );

      // RegionMapper.toDomain()はMock化せず、本物を使用する
      // Serviceのテストにおいて、RegionMapper は 「本物を使ってもOK」 な部類です。
      // 理由は Region ドメインと同様に、外部依存がなく、実行が高速で、副作用がないからです。

      // RepositoryのUTにて実施
      // 引数チェック
      // expect(
      //   jest.spyOn(prismaService.region, 'findUnique'),
      // ).toHaveBeenCalledWith({
      //   where: { id },
      // });

      expect(jest.spyOn(prismaService.region, 'update')).toHaveBeenCalledWith({
        data: {
          status: RegionStatus.SUSPENDED, // 厳密には、RegionStatus.suspended(PrismaのRegionStatus)だが、多めにみる。
          userId: userId,
          // updatedAtについて、new Date()はミリ秒で結果と期待値に誤差が出るので
          // expect.any(Date)としている。が、anyで警告が出るので、解除コメントを挿入。
          // updatedAt: new Date(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          updatedAt: expect.any(Date),
        },
        where: { id },
      });
    });

    it('異常系： 指定idに関連するRegion情報が存在しないので、NotFoundExceptionがスローされる', async () => {
      // serviceの引数作成
      const id = 'xxxx';
      const userId = '633931d5-2b25-45f1-8006-c137af49e53d';

      // mock data 作成(Repository): Regionが存在しない
      const mockException = new NotFoundException(
        `idに関連するエリア情報が存在しません!! regionId: ${id}`,
      );
      jest
        .spyOn(regionRepository, 'findByIdOrFail')
        .mockRejectedValue(mockException);

      // ⭐️TODO ここは、Repositoryにてテストを行う
      // mock data 作成 (データ無し)
      // jest.spyOn(prismaService.region, 'findUnique').mockResolvedValue(null);

      // 検証：NotFoundException
      await expect(regionsService.remove(id, userId)).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
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
 * 期待値作成
 *
 * memo:
 * mockDataの型指定(Region & { id: string })[]は不要（というかRegionはプレーンオブジェクト
 * ではないので型指定すると不一致エラーが出てしまうので、削除。
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
