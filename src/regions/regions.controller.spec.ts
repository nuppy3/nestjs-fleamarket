import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Request as ExpressRequest } from 'express';
import { RequestUser } from 'src/types/requestUser';
import {
  ReconstituteRegionProps,
  Region,
  RegionStatus,
} from './domain/regions.model';
import { CreateRegionDto, RegionResponseDto } from './dto/region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

const mockRegionsService = {
  findAll: jest.fn(),
  create: jest.fn(),
  findByCodeOrFail: jest.fn(),
  remove: jest.fn(),
  update: jest.fn(),
};

describe('■■■　Regions Controller TEST ■■■', () => {
  // DI対象モジュール宣言
  let regionsController: RegionsController;
  let regionsService: RegionsService;

  // テスト全体の前に1回だけ実行
  beforeAll(async () => {
    // console.log('beforeAll: モジュールのセットアップ');

    // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
    // この便利なDIの仕組みはNestJSの仕組み。
    // 最後の.compile()を忘れずに(compile()にてモジュールを生成する)
    const module = await Test.createTestingModule({
      // @Module({
      // imports: [PrismaModule],
      // controllers: [RegionsController],
      // providers: [RegionsService],
      // })

      // DI対象モジュール：module.tsをほぼコピペ（serviceのMockを指定する）
      controllers: [RegionsController],
      providers: [{ provide: RegionsService, useValue: mockRegionsService }],
    }).compile();

    regionsController = module.get<RegionsController>(RegionsController);
    regionsService = module.get<RegionsService>(RegionsService);
  });

  // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
  // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
  beforeEach(() => {
    // console.log('beforeEach: モックをリセット jest.clearAllMocks()');
    jest.clearAllMocks();
  });

  //--------------------------------
  // findAll()
  //--------------------------------
  describe('findAll', () => {
    it('正常系：dto配列(全項目)が返却される(dtoは全て@Expose()がセットされている', async () => {
      // service mock data 作成
      const domains: (Region & { id: string })[] = createServiceMockData();
      jest.spyOn(regionsService, 'findAll').mockResolvedValue(domains);

      // テスト対象Controller呼び出し
      const result = await regionsController.findAll();

      // 検証
      const dtos = createExpectedRegionDtos();
      expect(result).toEqual(dtos);
    });

    it('正常系：取得データが０件、dto[]の空配列が返却される', async () => {
      // mock data 作成(空配列)
      jest.spyOn(regionsService, 'findAll').mockResolvedValue([]);
      // test対象Controller呼び出し
      const result = await regionsController.findAll();
      // 検証：plainToInstance()は空配列が渡ってきた場合、空配列を返す
      expect(result).toEqual([]);
    });

    //-------------------------------
    // カバレッジ100%対応：
    // async findAll(): Promise<PrefectureResponseDto[]> {
    // の、<PrefectureResponseDto[]> {  が黄色くハイライトされてしまう問題。
    // このメソッドが「正常系（成功時）」しかテストされていため発生。
    //
    // async 関数は内部で Promise を返す ため、Jest（istanbul）のカバレッジでは以下の2つの「分岐」を
    // 考慮します：
    // resolved（成功） した場合のパス（正常に値が返る）
    // rejected（エラー） した場合のパス（throw または Promise.reject）
    // rejected（エラー）のケースが存在しないため発生。
    //
    // カバレッジを通すだけであれば適当なErrorを作成してテストを通すこともできるが、実際に発生しうる
    // PrismaのError（DB接続エラー）をモックして実装してみた。
    //
    // 20251224: 上記を実施するのは正しいらしいが、完全に黄色のハイライトは消えなかった。。
    //-------------------------------
    it('異常系(カバレッジ100%のため)： DB接続エラー', async () => {
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest.spyOn(regionsService, 'findAll').mockRejectedValue(connectionError);

      // Controllerがエラーをそのまま伝播（reject）することを確認
      await expect(regionsController.findAll()).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });
  });

  //--------------------------------
  // findByCodeOrFail()
  //--------------------------------
  describe('findByCodeOrFail test', () => {
    it('正常系: 指定したcodeを元に、エリア情報DTO（全項目）を返却する', async () => {
      // 引数
      const code = '01';

      // region servie mock data 作成
      const serviceModkRegionData = createServiceMockData().find(
        (region) => region.code === code,
      );
      jest
        .spyOn(regionsService, 'findByCodeOrFail')
        .mockResolvedValue(serviceModkRegionData!);

      // テスト対象controller呼び出し
      const result = await regionsController.findByCode(code);

      // 検証
      const expected = createExpectedRegionDtos().find(
        (region) => region.code === code,
      );
      expect(result).toEqual(expected);
    });

    it('異常系： codeに紐づくエリア情報なし（データ0件)の場合、NotFoundExceptionを伝播', async () => {
      // 引数
      const code = '00';

      // region service mock data 作成(NotFoundException)
      jest
        .spyOn(regionsService, 'findByCodeOrFail')
        .mockRejectedValue(
          new NotFoundException(
            `codeに関連するエリア情報が存在しません!! code: ${code}`,
          ),
        );

      // 検証
      await expect(
        jest.spyOn(regionsService, 'findByCodeOrFail'),
      ).rejects.toThrow(
        new NotFoundException(
          `codeに関連するエリア情報が存在しません!! code: ${code}`,
        ),
      );
    });

    // 上記のNotFoundExceptionの伝播を実施しているのでやる必要はないが、練習
    it('異常系： DB接続エラーの場合、エラーをそのまま伝播', async () => {
      // Error
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );

      // region service mock data 作成(NotFoundException)
      jest
        .spyOn(regionsService, 'findByCodeOrFail')
        .mockRejectedValue(connectionError);

      // 検証: Controllerがエラーをそのまま伝播（reject）することを確認
      // 厳密にErrorの内容を検証するため、toThew()→toMatchObject()に変更
      // toMatchObject()は引数のオブジェクトの内容がtoThrowとは異なるので注意。
      // → toThew()での検証のままでもいい気もする。
      await expect(
        jest.spyOn(regionsService, 'findByCodeOrFail'),
      ).rejects.toMatchObject({
        name: 'PrismaClientKnownRequestError',
        code: 'P1001',
        message: "Can't reach database server",
        clientVersion: '5.0.0',
      });
    });
  });

  //--------------------------------
  // create()
  //--------------------------------
  describe('create test', () => {
    // 共通引数：ユーザーID
    const request: Partial<ExpressRequest & { user: Partial<RequestUser> }> = {
      user: { id: '633931d5-2b25-45f1-8006-c137af49e53d' },
    };

    it('正常系: ReginResponseDto(全項目)を返却する', async () => {
      // controller 引数（dto)作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // service mock data 作成
      // 自作のdomain作成メソッドで自作自演にならないの？ → ならない。本物を使うべき！
      // Mock（入力値や外部サービスの戻り値）に関しては、本物のクラス（または完璧な模倣）を
      // 返すべきです。なぜなら、その Mock を受け取る「
      // テスト対象のコード」が、Region クラスであることを前提に動くから。
      // 一方、テストの期待値 (Expected):→ クラスを使わずリテラルで比較すべき（自作自演防止）。

      // mock Region domain 作成用の Props
      const mockProps = {
        code: '10',
        name: '沖縄',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies ReconstituteRegionProps;
      // mock Region domain 作成
      const mockRegion = Region.reconstitute(mockProps);
      // mock Region domain + id
      const serviceMockData = Object.assign(mockRegion, {
        id: '1024dc98-89a2-4db1-9431-b20feff57700',
      });

      // mock data set
      jest.spyOn(regionsService, 'create').mockResolvedValue(serviceMockData);

      // テスト対象controller呼び出し
      const result = await regionsController.create(
        dto,
        // 型アサーションでキャスト（Partialで作成したmockRequestは実際の型(ExpressRequestを使っている)と
        // 完全に一致しないため、保守性がやや低下する可能性があるため）
        request as ExpressRequest & { user: RequestUser },
      );

      // 検証
      expect(result).toEqual({
        id: '1024dc98-89a2-4db1-9431-b20feff57700',
        code: '10',
        name: '沖縄',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
        statusLabel: '反映中',
      } satisfies RegionResponseDto);
    });

    it('異常系: reginServiceにエラーが発生した場合、元のエラーをそのまま伝搬する', async () => {
      // controller 引数（dto)作成
      const dto = {
        name: '沖縄',
        code: '10',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
      } satisfies CreateRegionDto;

      // service mock data(Error) 作成
      const conectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest.spyOn(regionsService, 'create').mockRejectedValue(conectionError);

      // テスト対象controller呼び出し
      await expect(
        regionsController.create(
          dto,
          // 型アサーションでキャスト（Partialで作成したmockRequestは実際の型(ExpressRequestを使っている)と
          // 完全に一致しないため、保守性がやや低下する可能性があるため）
          request as ExpressRequest & { user: RequestUser },
        ),
      ).rejects.toThrow(PrismaClientKnownRequestError);

      // 検証
    });
  });

  //--------------------------------
  // update() test
  //--------------------------------
  describe('update() test', () => {
    it('正常系：指定idに関連するエリア情報を更新し、削除対象のDto(全項目)を返却する', async () => {
      // 引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a'; // 北海道
      const req: Partial<ExpressRequest & { user: RequestUser }> = {
        user: {
          id: '633931d5-2b25-45f1-8006-c137af49e53d',
          // 以下は適当で。user: Partial<RequestUser> でもいいけどね。
          name: '',
          status: 'FREE',
        },
      };
      const dto = {
        name: '北海道テスト',
        code: '99',
        kanaName: 'ほっかいどうてすと',
        status: 'published',
        kanaEn: 'hokkaidoutest',
      } satisfies UpdateRegionDto;

      // mock data 作成
      const updatedDomain = Region.reconstitute({
        // id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道テスト',
        code: '99',
        kanaName: 'ほっかいどうてすと',
        status: 'published',
        kanaEn: 'hokkaidoutest',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-25T12:30:00.000Z'),
      } satisfies ReconstituteRegionProps);
      const updatedDomainWithId = Object.assign(updatedDomain, {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      });

      // service に mock deta セット
      jest
        .spyOn(regionsService, 'update')
        .mockResolvedValue(updatedDomainWithId);

      // test 対象 controller 呼び出し
      const result = await regionsController.update(
        id,
        dto,
        // 型アサーションでキャスト（Partialで作成したmockRequestは実際の型(ExpressRequestを使っている)と
        // 完全に一致しないため、保守性がやや低下する可能性があるため）
        req as ExpressRequest & { user: RequestUser },
      );

      // 検証
      expect(result).toEqual({
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道テスト',
        code: '99',
        kanaName: 'ほっかいどうてすと',
        status: 'published',
        kanaEn: 'hokkaidoutest',
        statusLabel: '反映中',
      } satisfies RegionResponseDto);
    });

    it('異常系：idに関連するエリア情報が存在しない。(serviceのNotFoundExceptionを伝播', async () => {
      // 引数作成
      const id = 'xxxx';
      const req: Partial<ExpressRequest & { user: RequestUser }> = {
        user: {
          id: '633931d5-2b25-45f1-8006-c137af49e53d',
          // 以下は適当で。user: Partial<RequestUser> でもいいけどね。
          name: '',
          status: 'FREE',
        },
      };
      const dto = {
        name: '北海道テスト',
        code: '99',
        kanaName: 'ほっかいどうてすと',
        status: 'published',
        kanaEn: 'hokkaidoutest',
      } satisfies UpdateRegionDto;

      // mock data (NotFoundException)
      jest
        .spyOn(regionsService, 'update')
        .mockRejectedValue(
          new NotFoundException(
            `idに関連するエリア情報が存在しません!! regionId: ${id}`,
          ),
        );

      // 検証
      await expect(
        regionsController.update(
          id,
          dto,
          req as ExpressRequest & { user: RequestUser },
        ),
      ).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
      );
    });
  });

  //--------------------------------
  // remove()
  //--------------------------------
  describe('remove() test', () => {
    it('正常系：指定idに関連するエリア情報を削除し、削除対象のDto(全項目)を返却する', async () => {
      // 引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a';
      const req: Partial<ExpressRequest & { user: RequestUser }> = {
        user: {
          id: '633931d5-2b25-45f1-8006-c137af49e53d',
          // 以下は適当で。user: Partial<RequestUser> でもいいけどね。
          name: '',
          status: 'FREE',
        },
      };

      // mock data 作成
      jest
        .spyOn(regionsService, 'remove')
        .mockResolvedValue(
          createServiceMockData().find((region) => region.id === id)!,
        );

      // test 対象 controller 呼び出し
      const result = await regionsController.remove(
        id,
        // 型アサーションでキャスト（Partialで作成したmockRequestは実際の型(ExpressRequestを使っている)と
        // 完全に一致しないため、保守性がやや低下する可能性があるため）
        req as ExpressRequest & { user: RequestUser },
      );

      // 検証
      expect(result).toEqual(
        createExpectedRegionDtos().find((region) => region.id === id),
      );
    });

    it('異常系：idに関連するエリア情報が存在しない。(serviceのNotFoundExceptionを伝播', async () => {
      // 引数作成
      const id = 'xxxx';
      const req: Partial<ExpressRequest & { user: RequestUser }> = {
        user: {
          id: '633931d5-2b25-45f1-8006-c137af49e53d',
          // 以下は適当で。user: Partial<RequestUser> でもいいけどね。
          name: '',
          status: 'FREE',
        },
      };

      // mock data (NotFoundException)
      jest
        .spyOn(regionsService, 'remove')
        .mockRejectedValue(
          new NotFoundException(
            `idに関連するエリア情報が存在しません!! regionId: ${id}`,
          ),
        );

      // 検証
      await expect(
        regionsController.remove(
          id,
          req as ExpressRequest & { user: RequestUser },
        ),
      ).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
      );
    });
  });
});

/**
 * region service mock data 作成
 * @returns region service mock data
 */
function createServiceMockData() {
  // domain作成用のProps+idリスト
  const propsList = [
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
      id: '4164ffe0-d68b-4de4-9139-88c7c7849709',
      name: '関東',
      code: '03',
      kanaName: 'かんとう',
      status: 'editing',
      kanaEn: 'kanto',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '7a7adc8a-20bc-4323-9ff1-6aebc48f847c',
      name: '沖縄',
      code: '10',
      kanaName: '沖縄',
      status: RegionStatus.SUSPENDED,
      kanaEn: 'okinawa',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ] satisfies (ReconstituteRegionProps & { id: string })[];

  const domainWithIds: (Region & { id: string })[] = propsList.map((props) => {
    const domain = Region.reconstitute(props);
    return Object.assign(domain, { id: props.id });
  });

  return domainWithIds;
}

/**
 * 期待値：Region DTO 作成
 * @returns Region DTO
 */
function createExpectedRegionDtos(): RegionResponseDto[] {
  const dtos: RegionResponseDto[] = [
    {
      id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      name: '北海道',
      code: '01',
      kanaName: 'ほっかいどう',
      status: 'published',
      kanaEn: 'hokkaidou',
      statusLabel: '反映中',
    },
    {
      id: 'ad24dc98-89a2-4db1-9431-b20feff57700',
      name: '東北',
      code: '02',
      kanaName: 'とうほく',
      status: 'published',
      kanaEn: 'tohoku',
      statusLabel: '反映中',
    },
    {
      id: '4164ffe0-d68b-4de4-9139-88c7c7849709',
      name: '関東',
      code: '03',
      kanaName: 'かんとう',
      status: 'editing',
      kanaEn: 'kanto',
      statusLabel: '編集中',
    },
    {
      id: '7a7adc8a-20bc-4323-9ff1-6aebc48f847c',
      name: '沖縄',
      code: '10',
      kanaName: '沖縄',
      status: RegionStatus.SUSPENDED,
      kanaEn: 'okinawa',
      statusLabel: '停止',
    },
  ];

  return dtos;
}
