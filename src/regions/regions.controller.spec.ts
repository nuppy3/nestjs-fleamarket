import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CreateRegionDto, RegionResponseDto } from './dto/region.dto';
import { RegionsController } from './regions.controller';
import { Region, RegionStatus } from './regions.model';
import { RegionsService } from './regions.service';

const mockRegionsService = {
  findAll: jest.fn(),
  create: jest.fn(),
};

describe('■■■　Regions Controller TEST ■■■', () => {
  // DI対象モジュール宣言
  let regionsController: RegionsController;
  let regionsService: RegionsService;

  // テスト全体の前に1回だけ実行
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ');

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
    console.log('beforeEach: モックをリセット jest.clearAllMocks()');
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
  // create()
  //--------------------------------
  describe('create', () => {
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
      const serviceMockData = {
        id: '1024dc98-89a2-4db1-9431-b20feff57700',
        code: '10',
        name: '沖縄',
        kanaName: 'おきなわ',
        status: RegionStatus.PUBLISHED,
        kanaEn: 'okinawa',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      } satisfies Region & { id: string };
      // mock data set
      jest.spyOn(regionsService, 'create').mockResolvedValue(serviceMockData);

      // テスト対象controller呼び出し
      const result = await regionsController.create(dto);

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
      await expect(regionsController.create(dto)).rejects.toThrow(
        PrismaClientKnownRequestError,
      );

      // 検証
    });
  });
});

function createServiceMockData(): (Region & { id: string })[] {
  const domains: (Region & { id: string })[] = [
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
  ];
  return domains;
}

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
  ];

  return dtos;
}
