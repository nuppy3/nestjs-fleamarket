import { Test } from '@nestjs/testing';
import { CreateStoreDto, StoreResponseDto } from './dto/store.dto';
import { StoresController } from './stores.controller';
import { Store } from './stores.model';
import { StoresService } from './stores.service';
// fn()はmock関数(振る舞いはテスト実施時に指定)
const mockStoresService = {
  findAll: jest.fn(),
  create: jest.fn(),
};

// 関連する複数のテストをグループ化
describe('StoresController TEST', () => {
  // DI対象モジュールの宣言
  let storesController: StoresController; // テスト対象
  let storesService: StoresService; // Controllerから呼ばれるServiceはMock化
  let mockStores: (Store & { id: string })[];
  let expectedStoreDtos: StoreResponseDto[];

  // テスト全体の前に1回だけ実行
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ');

    // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
    // この便利なDIの仕組みはNestJSの仕組み。
    // 最後の.compile()を忘れずに(compile()にてモジュールを生成する)
    const module = await Test.createTestingModule({
      // DI対象モジュール：module.tsをほぼコピペ（serviceのMockを指定する）
      controllers: [StoresController],
      providers: [{ provide: StoresService, useValue: mockStoresService }],
    }).compile();

    storesController = module.get<StoresController>(StoresController);
    storesService = module.get<StoresService>(StoresService);
    // serviceの正常系返却値(Storeドメイン＋id配列のmock)
    mockStores = createMockStoresWithId();
    // Controllerの返却値の期待値(StoreResponseDto配列)
    expectedStoreDtos = createExpectedStoreDtos();
  });

  // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
  // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
  beforeEach(() => {
    console.log('beforeEach: モックをリセット jest.clearAllMocks()');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系：店舗情報のリストを返却する(DTOの全項目)', async () => {
      // ServiceのMockデータを作成
      jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);
      // テスト対象Controller呼び出し
      const resoult = await storesController.findAll();
      // 検証
      expect(resoult).toEqual(expectedStoreDtos);
    });
    it('正常系： 店舗情報のリストを返却する(domainの任意項目undefined→DTOの任意項目除外）', async () => {
      // SerivceのMockデータを作成
      jest.spyOn(storesService, 'findAll').mockResolvedValue(
        // --- DTOの任意項目をundefinedに書き換え ---
        // （{})であたらしい{}オブジェクトを作成し、...storeのスプレッド構文でコピーした後、
        //  任意の項目を更新している： 元のStoreオブジェクトに影響なし
        // 「アロー関数でオブジェクトを返すときは、必ず ( ) で囲む！」
        mockStores.map((store) => ({
          ...store,
          kanaName: undefined,
          zipCode: undefined,
          address: undefined,
          prefecture: undefined,
          holidays: undefined,
          businessHours: undefined,
        })),
        // 以下でもOK：以下はわかりやすいが、上記より少し遅いらしい。
        // {
        // const tmpStore = Object.assign({}, store);
        // tmpStore.kanaName = undefined;
        // tmpStore.zipCode = undefined;
        // tmpStore.address = undefined;
        // tmpStore.prefecture = undefined;
        // tmpStore.holidays = undefined;
        // tmpStore.businessHours = undefined;
        // return tmpStore;
        // }),
      );

      // テスト対象呼び出し
      const result = await storesController.findAll();
      // 検証
      expect(result).toEqual(
        // 期待値：DTOから任意項目を削除
        expectedStoreDtos.map((dto) =>
          // ({
          //   id: dto.id,
          //   name: dto.name,
          //   status: dto.status,
          //   statusLabel: dto.statusLabel,
          //   email: dto.email,
          //   phoneNumber: dto.phoneNumber,
          //   createdAt: dto.createdAt,
          //   updatedAt: dto.updatedAt,
          // }) as StoreResponseDto,
          // 上記でもいいが、型安全のためOmitにして遊んでみた。GPT的には以下がいいらしい。が、どっちでもいい。
          {
            const expectedDto: Omit<
              StoreResponseDto,
              | 'kanaName'
              | 'zipCode'
              | 'address'
              | 'prefecture'
              | 'businessHours'
              | 'holidays'
              | 'holidaysLabel'
            > = {
              id: dto.id,
              name: dto.name,
              status: dto.status,
              statusLabel: dto.statusLabel,
              email: dto.email,
              phoneNumber: dto.phoneNumber,
              createdAt: dto.createdAt,
              updatedAt: dto.updatedAt,
            };
            return expectedDto;
          },
        ),
      );
    });
    it('正常系： データなし', async () => {
      jest.spyOn(storesService, 'findAll').mockResolvedValue([]);
      const result = await storesController.findAll();
      expect(result).toEqual([]);
    });
  });
  describe('create TEST', () => {
    it('正常系： 店舗情報作成（DTOの全項目あり）し、DTO全項目を返却する', async () => {
      // create()の引数作成
      const reqDto: CreateStoreDto = {
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        prefecture: '東京都',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '埼玉県北区赤羽３丁目',
        businessHours: '10:00-20:00',
      };

      // service mock data
      jest.spyOn(storesService, 'create').mockResolvedValue({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        prefecture: '東京都',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '埼玉県北区赤羽３丁目',
        businessHours: '10:00-20:00',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto);

      // 検証
      expect(result).toEqual({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        prefecture: '東京都',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '埼玉県北区赤羽３丁目',
        businessHours: '10:00-20:00',
        statusLabel: '営業中',
        holidaysLabel: ['水', '日'],
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });
    });

    it('正常系: 店舗情報作成（DTOの任意項目除外）し、DTO(任意項目除外)を返却する', async () => {
      // create()の引数作成
      const reqDto: CreateStoreDto = {
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        // kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
        // holidays: ['WEDNESDAY', 'SUNDAY'],
        // zipCode: '100-0001',
        // address: '埼玉県北区赤羽３丁目',
        // businessHours: '10:00-20:00',
      };

      // service mock data
      jest.spyOn(storesService, 'create').mockResolvedValue({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        // kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
        // holidays: ['WEDNESDAY', 'SUNDAY'],
        // zipCode: '100-0001',
        // address: '埼玉県北区赤羽３丁目',
        // businessHours: '10:00-20:00',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto);

      // 検証
      expect(result).toEqual({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        // kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
        // holidays: ['WEDNESDAY', 'SUNDAY'],
        // zipCode: '100-0001',
        // address: '埼玉県北区赤羽３丁目',
        // businessHours: '10:00-20:00',
        statusLabel: '営業中',
        // holidaysLabel: ['水', '日'],
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });
    });

    it('正常系: 店舗情報作成（DTOの任意項目をundefined）し、DTO(任意項目除外)を返却する', async () => {
      // create()の引数作成
      const reqDto: CreateStoreDto = {
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
      };

      // service mock data
      jest.spyOn(storesService, 'create').mockResolvedValue({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto);

      // 検証
      expect(result).toEqual({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        // kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
        // holidays: ['WEDNESDAY', 'SUNDAY'],
        // zipCode: '100-0001',
        // address: '埼玉県北区赤羽３丁目',
        // businessHours: '10:00-20:00',
        statusLabel: '営業中',
        // holidaysLabel: ['水', '日'],
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      });
    });
  });
});

/**
 * Serviceの返却値(Store+idの配列)を作成
 */
function createMockStoresWithId(): (Store & { id: string })[] {
  const stores: (Store & { id: string })[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      name: '山田電気 江戸川店',
      status: 'editing',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      name: '山田電気 銀座店',
      status: 'suspended',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
    },
  ];
  return stores;
}

/**
 * Controllerの期待値/返却値(Store+idの配列)を作成
 */
function createExpectedStoreDtos(): StoreResponseDto[] {
  const stores: StoreResponseDto[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '営業中',
      holidaysLabel: ['水', '日'],
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      name: '山田電気 江戸川店',
      status: 'editing',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '編集中',
      holidaysLabel: ['水', '日'],
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      name: '山田電気 銀座店',
      status: 'suspended',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '閉店',
      holidaysLabel: ['水', '日'],
    },
  ];
  return stores;
}
