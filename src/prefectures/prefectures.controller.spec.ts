import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrefecturesService } from '../prefectures/prefectures.service';
import {
  CreatePrefectureDto,
  PrefectureResponseDto,
} from './dto/prefecture.dto';
import { PrefecturesController } from './prefectures.controller';
import { Prefecture, PrefectureWithCoverage } from './prefectures.model';

const mockPrerectureService = {
  findAll: jest.fn(),
  findAllWithStoreCount: jest.fn(),
  create: jest.fn(),
};

describe('■■■ Prefectures Controller TEST ■■■', () => {
  // DI対象モジュール宣言
  let prefecturesController: PrefecturesController; // テスト対象
  let prefecturesService: PrefecturesService; // Controllerから呼ばれるService

  // servic mock data(domain[])
  let mockPrefectures: (Prefecture & { id: string })[];
  // controller mock data(期待値:dto[])
  let expectedPrefectureDtos: PrefectureResponseDto[];

  // テスト全体の前に1回だけ実行
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ');

    // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
    // この便利なDIの仕組みはNestJSの仕組み。
    // 最後の.compile()を忘れずに(compile()にてモジュールを生成する)
    const module = await Test.createTestingModule({
      // @Module({
      //   imports: [PrismaModule],
      //   controllers: [PrefecturesController],
      //   providers: [PrefecturesService],
      // })

      // DI対象モジュール：module.tsをほぼコピペ（serviceのMockを指定する）
      controllers: [PrefecturesController],
      providers: [
        { provide: PrefecturesService, useValue: mockPrerectureService },
      ],
    }).compile();

    prefecturesController = module.get<PrefecturesController>(
      PrefecturesController,
    );
    prefecturesService = module.get<PrefecturesService>(PrefecturesService);
    // service mock data
    mockPrefectures = createSriviceMockData();
    // controller mock data(期待値)
    expectedPrefectureDtos = createExpectedPrefectureDtos();
  });

  // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
  // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
  beforeEach(() => {
    console.log('beforeEach: モックをリセット jest.clearAllMocks()');
    jest.clearAllMocks();
  });

  //--------------------------------
  // findAll()
  //--------------------------------
  describe('findAll', () => {
    it('正常系：dto配列(全項目)が返却される(dtoは全て@Expose()がセットされている', async () => {
      // service mock data 作成
      const domains: (Prefecture & { id: string })[] = mockPrefectures;
      jest.spyOn(prefecturesService, 'findAll').mockResolvedValue(domains);

      // テスト対象Controller呼び出し
      const result = await prefecturesController.findAll();

      // 検証
      expect(result).toEqual(expectedPrefectureDtos);
    });
    it('正常系：取得データが０件、dto[]の空配列が返却される', async () => {
      // mock data 作成(空配列)
      jest.spyOn(prefecturesService, 'findAll').mockResolvedValue([]);
      // test対象Controller呼び出し
      const result = await prefecturesController.findAll();
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
      jest
        .spyOn(prefecturesService, 'findAll')
        .mockRejectedValue(connectionError);

      // Controllerがエラーをそのまま伝播（reject）することを確認
      await expect(prefecturesController.findAll()).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });
  });

  //--------------------------------
  // findCovered()
  //--------------------------------
  describe('findCovered', () => {
    it('正常系：dto配列(全項目)が返却される(dtoは全て@Expose()がセットされている', async () => {
      // service mock data 作成
      const domains: PrefectureWithCoverage[] =
        createSriviceMockDataWithCoverage();
      jest
        .spyOn(prefecturesService, 'findAllWithStoreCount')
        .mockResolvedValue(domains);

      // テスト対象Controller呼び出し
      const result = await prefecturesController.findCovered();

      // 検証
      expect(result).toEqual(createExpectedPrefectureWithCoverageDtos());
    });

    it('正常系：取得データが０件、dto[]の空配列が返却される', async () => {
      // mock data 作成(空配列)
      jest
        .spyOn(prefecturesService, 'findAllWithStoreCount')
        .mockResolvedValue([]);
      // test対象Controller呼び出し
      const result = await prefecturesController.findCovered();
      // 検証：plainToInstance()は空配列が渡ってきた場合、空配列を返す
      expect(result).toEqual([]);
    });

    it('異常系(カバレッジ100%のため)： DB接続エラー', async () => {
      const connectionError = new PrismaClientKnownRequestError(
        "Can't reach database server",
        { code: 'P1001', clientVersion: '5.0.0' },
      );
      jest
        .spyOn(prefecturesService, 'findAllWithStoreCount')
        .mockRejectedValue(connectionError);

      // Controllerがエラーをそのまま伝播（reject）することを確認
      await expect(prefecturesController.findAll()).rejects.toThrow(
        PrismaClientKnownRequestError,
      );
    });
  });

  //--------------------------------
  // create()
  //--------------------------------
  describe('create', () => {
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', async () => {
      // Controllerの引数作成
      const requestDto: CreatePrefectureDto = {
        name: '石川県',
        code: '17',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
      };

      // service mock data 作成(domain + id)
      const domainWithId: Prefecture & { id: string } = {
        id: '27d991fd-fd54-4abd-b9c0-1f24270e8295',
        name: '石川県',
        code: '17',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      };
      jest.spyOn(prefecturesService, 'create').mockResolvedValue(domainWithId);

      // test対象controller呼び出し
      const result = await prefecturesController.create(requestDto);

      // 期待値作成(dto→plainToInstanceした時のオブジェクト)
      const expecedData: PrefectureResponseDto = {
        id: '27d991fd-fd54-4abd-b9c0-1f24270e8295',
        name: '石川県',
        code: '17',
        kanaName: 'イシカワ',
        kanaEn: 'ishikawa',
        status: 'published',
        statusLabel: '反映中',
      };

      // 検証
      expect(result).toEqual(expecedData);
    });
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
  });
});

//-----------------------------------
// 以下は、
// Postmanでnameなどの項目無しでリクエストすると、controllerのvalidationで弾かれるので
// service-prismaに対して項目無しのリクエストを投げることができないので、describeを分けて、
// 本物のservice-prismaを使用したテストにて検証してみる。
// → と思ったけど、ちゃんと型指定でリクエストパラメータを作成したらname無しのオブジェクトは
// 静的方チェックエラーで引っかかるので、テストする必要ないな。。と気づいた。。。
//-----------------------------------

// describe('■■■ PrefecturesController (Integration Tests - Real Service) ■■■', () => {
//   // DI対象モジュール宣言
//   let prefecturesController: PrefecturesController; // テスト対象

//   // テスト全体の前に1回だけ実行
//   beforeAll(async () => {
//     console.log('beforeAll: モジュールのセットアップ');

//     // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
//     // この便利なDIの仕組みはNestJSの仕組み。
//     // 最後の.compile()を忘れずに(compile()にてモジュールを生成する)
//     const module = await Test.createTestingModule({
//       // @Module({
//       //   imports: [PrismaModule],
//       //   controllers: [PrefecturesController],
//       //   providers: [PrefecturesService],
//       // })

//       // DI対象モジュール：module.tsをほぼコピペ（serviceのMockを指定する）
//       controllers: [PrefecturesController],
//       // mockではなく、本物を使用。serviceだけではなく、そこから呼ばれるPrismaServiceもDI
//       providers: [PrefecturesService, PrismaService],
//     }).compile();

//     prefecturesController = module.get<PrefecturesController>(
//       PrefecturesController,
//     );
//   });

//   // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
//   // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
//   beforeEach(() => {
//     console.log('beforeEach: モックをリセット jest.clearAllMocks()');
//     jest.clearAllMocks();
//   });

//   //-----------------------------------
//   // Postmanでnameなどの項目無しでリクエストすると、controllerのvalidationで弾かれるので
//   // service-prismaに対して項目無しのリクエストを投げることができないので、当該テストにて
//   // 検証してみる
//   // → と思ったけど、ちゃんと型指定でリクエストパラメータを作成したらname無しのオブジェクトは
//   // 静的方チェックエラーで引っかかるので、テストする必要ないな。。と気づいた。。。
//   //-----------------------------------
//   it('異常系：nameなしで都道府県情報作成（nameなし）し、エラーを返却する', async () => {
//     // controllerの引数作成
//     const reqDto: CreatePrefectureDto = {
//       // name: '石川県',
//       code: '17',
//       kanaName: 'イシカワ',
//       kanaEn: 'ishikawa',
//       status: 'published',
//     };
//     // テスト対象controller呼び出し
//     const result = await prefecturesController.create(reqDto);
//     // 検証
//   });
// });

/**
 * PrefectureServiceのMockデータを作成
 * @returns
 */
function createSriviceMockData(): (Prefecture & { id: string })[] {
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

/**
 * PrefectureServiceのMockデータを作成
 * @returns
 */
function createSriviceMockDataWithCoverage(): PrefectureWithCoverage[] {
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
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      storeCount: 10,
    },
  ];

  return domains;
}

/**
 * PrefectureResponseDto期待値作成
 * @returns PrefectureResponseDto(期待値)
 */
function createExpectedPrefectureDtos(): PrefectureResponseDto[] {
  const dtos: PrefectureResponseDto[] = [
    {
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '北海道',
      code: '01',
      kanaName: 'ホッカイドウ',
      status: 'published',
      kanaEn: 'hokkaido',
      statusLabel: '反映中',
    },
    {
      id: '274d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '青森',
      code: '02',
      kanaName: 'アオモリ',
      status: 'published',
      kanaEn: 'aomori',
      statusLabel: '反映中',
    },
    {
      id: '374d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '秋田',
      code: '03',
      kanaName: 'アキタ',
      status: 'published',
      kanaEn: 'akita',
      statusLabel: '反映中',
    },
    {
      id: '474d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '岩手',
      code: '04',
      kanaName: 'イワテ',
      status: 'published',
      kanaEn: 'iwate',
      statusLabel: '反映中',
    },
    {
      id: '574d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山形',
      code: '05',
      kanaName: 'ヤマガタ',
      status: 'published',
      kanaEn: 'yamagata',
      statusLabel: '反映中',
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '東京都',
      code: '13',
      kanaName: 'トウキョウト',
      status: 'published',
      kanaEn: 'tokyo-to',
      statusLabel: '反映中',
    },
  ];

  return dtos;
}

/**
 * PrefectureResponseDto期待値作成
 * @returns PrefectureResponseDto(期待値)
 */
function createExpectedPrefectureWithCoverageDtos(): PrefectureResponseDto[] {
  const dtos: PrefectureResponseDto[] = [
    {
      id: '174d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '北海道',
      code: '01',
      kanaName: 'ホッカイドウ',
      status: 'published',
      kanaEn: 'hokkaido',
      statusLabel: '反映中',
      storeCount: 1,
    },
    {
      id: '674d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '東京都',
      code: '13',
      kanaName: 'トウキョウト',
      status: 'published',
      kanaEn: 'tokyo-to',
      statusLabel: '反映中',
      storeCount: 10,
    },
  ];

  return dtos;
}
