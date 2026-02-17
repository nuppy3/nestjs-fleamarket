import { Test } from '@nestjs/testing';
import type { Request as ExpressRequest } from 'express';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { RequestUser } from 'src/types/requestUser';
import {
  CreateStoreDto,
  FindAllStoresQueryDto,
  PaginatedStoreResponseDto,
  PaginationMetaDto,
  StoreResponseDto,
} from './dto/store.dto';
import { StoresController } from './stores.controller';
import { SortBy, SortOrder, Store, StoreStatus } from './stores.model';
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
  let mockStores: PaginatedResult<Store & { id: string }>;
  let expectedStoreDto: PaginatedStoreResponseDto;

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
    expectedStoreDto = createExpectedStoreDto();
  });

  // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
  // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
  beforeEach(() => {
    console.log('beforeEach: モックをリセット jest.clearAllMocks()');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系：店舗情報のリストを返却する(DTOの全項目) - RequestPrameter 無し', async () => {
      // ServiceのMockデータを作成
      jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);
      // テスト対象Controller呼び出し
      // 引数: 絞り込み条件無し
      const query: FindAllStoresQueryDto = {};
      const resoult = await storesController.findAll(query);
      // 検証
      expect(resoult).toEqual(expectedStoreDto);
    });

    describe('findAllの絞り込み(filter)テスト', () => {
      it('正常系(1)：prefectureCodeを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          prefectureCode: '13',
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith({
          prefectureCode: '13',
        });
      });

      it('正常系(2)：statusを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          status: 'published',
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });

      it('正常系(3)：店舗を指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          name: '赤羽',
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith({
          name: '赤羽',
        });
      });

      it('正常系(4)：regionCodeを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          regionCode: '03',
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });

      it('正常系(5)：sortOrderを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          sortOrder: SortOrder.ASC,
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });

      it('正常系(6)：sortByを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          sortBy: SortBy.ID,
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });

      it('正常系(7)：sizeを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          size: 20,
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });
      it('正常系(8)：pageを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          page: 1,
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });

      it('正常系(9)：XXXXXを指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成：中身は適当
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          regionCode: '03',
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        // filterのテストは以下の結果検証は不要
        // expect(result).toEqual(expectedStoreDto);
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith(
          query,
        );
      });
    });

    describe('findAllの絞り込み(filter) 複合条件のテスト', () => {
      // queryの変換処理はcontrolerで実施していないし、
      // controllerで複合ケースの試験は不要な気もするが一応
      it('(1)+(2)+(3)+(4)+(5)+(6)+(7)+(8) 都道府県コード/status/name/エリアコード/ソート条件を指定した場合、Serviceを期待通りの引数で呼んでいるか', async () => {
        // ServiceのMockデータを作成
        jest.spyOn(storesService, 'findAll').mockResolvedValue(mockStores);

        // テスト対象Controller呼び出し:適当なクエリを渡す
        // 引数: 一応意味のあるモノにしたが、中身は適当でよい
        const query: FindAllStoresQueryDto = {
          prefectureCode: '13',
          status: StoreStatus.PUBLISHED,
          name: '赤羽',
          regionCode: '03',
          sortOrder: SortOrder.ASC,
          sortBy: SortBy.ID,
          size: 20,
          page: 1,
        };
        await storesController.findAll(query);

        // 検証: Serviceを期待通りの引数で呼んでいるか → store.controler内で、特にqueryを
        // 変換処理せずにserviceに渡してるので、当該試験はあまり意味がないが、一応
        expect(jest.spyOn(storesService, 'findAll')).toHaveBeenCalledWith({
          prefectureCode: '13',
          status: 'published',
          name: '赤羽',
          regionCode: '03',
          sortOrder: 'asc',
          sortBy: 'id',
          size: 20,
          page: 1,
        });
      });
    });

    it('正常系： 店舗情報のリストを返却する(domainの任意項目undefined→DTOの任意項目除外）', async () => {
      // SerivceのMockデータを作成
      jest.spyOn(storesService, 'findAll').mockResolvedValue(
        // --- DTOの任意項目をundefinedに書き換え ---
        // （{})であたらしい{}オブジェクトを作成し、...storeのスプレッド構文でコピーした後、
        //  任意の項目を更新している： 元のStoreオブジェクトに影響なし
        // 「.map()のアロー関数でオブジェクトを返すときは、必ず ( ) で囲む！」
        {
          data: mockStores.data.map((store) => ({
            ...store,
            code: undefined,
            kanaName: undefined,
            zipCode: undefined,
            address: undefined,
            // prefecture: undefined,
            holidays: undefined,
            businessHours: undefined,
            prefecture: undefined,
          })),
          meta: {
            totalCount: 1,
            page: 1,
            size: 20,
          },
        } satisfies PaginatedResult<Store & { id: string }>,

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
      // 引数: 絞り込み条件無し
      const query: FindAllStoresQueryDto = {};
      const result = await storesController.findAll(query);
      console.log('result: ');
      console.log(result);
      // 検証
      expect(result).toEqual({
        data:
          // 期待値：DTOから任意項目を削除
          expectedStoreDto.data.map((dto) =>
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
                | 'code'
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
        meta: {
          totalCount: 1,
          page: 1,
          size: 20,
        },
      } as PaginatedStoreResponseDto);
    });

    it('正常系： データなし', async () => {
      jest.spyOn(storesService, 'findAll').mockResolvedValue({
        data: [],
        meta: { totalCount: 0, page: 1, size: 20 },
      } satisfies PaginatedResult<Store & { id: string }>);

      // 引数: 絞り込み条件無し
      const query: FindAllStoresQueryDto = { name: 'ほげほげほげ' };
      const result = await storesController.findAll(query);
      expect(result).toEqual({
        data: [],
        meta: { totalCount: 0, size: 20, page: 1 },
      } satisfies PaginatedStoreResponseDto);
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
        // prefecture: '東京都',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '埼玉県北区赤羽３丁目',
        businessHours: '10:00-20:00',
      };

      // ExpressRequest & { user: RequestUser }
      // ExpressRequestの全項目を作成することはむずかしいためPartial(任意項目)として作成(mockデータ作成)
      const param: ExpressRequest & { user: RequestUser } = createRequest();

      // service mock data
      jest.spyOn(storesService, 'create').mockResolvedValue({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
        holidays: ['WEDNESDAY', 'SUNDAY'],
        zipCode: '100-0001',
        address: '埼玉県北区赤羽３丁目',
        businessHours: '10:00-20:00',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto, param);

      // 検証
      expect(result).toEqual({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
        // prefecture: '東京都',
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

      // ExpressRequest & { user: RequestUser }
      // ExpressRequestの全項目を作成することはむずかしいためPartial(任意項目)として作成(mockデータ作成)
      const param: ExpressRequest & { user: RequestUser } = createRequest();

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
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto, param);

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
        // prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
      };

      // ExpressRequest & { user: RequestUser }
      // ExpressRequestの全項目を作成することはむずかしいためPartial(任意項目)として作成(mockデータ作成)
      const param: ExpressRequest & { user: RequestUser } = createRequest();

      // service mock data
      jest.spyOn(storesService, 'create').mockResolvedValue({
        id: '12345678-7012-462c-b7d0-7e452ba0f1ab',
        name: '山田電気 川口店',
        status: 'published',
        email: 'yamada-akabane@test.co.jp',
        phoneNumber: '03-1122-9901',
        kanaName: undefined,
        // prefecture: undefined,
        holidays: undefined,
        zipCode: undefined,
        address: undefined,
        businessHours: undefined,
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      });

      // テスト対象controller呼び出し
      const result = await storesController.create(reqDto, param);

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
function createMockStoresWithId(): PaginatedResult<Store & { id: string }> {
  const stores: (Store & { id: string })[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      code: '00001',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      code: '00002',
      name: '山田電気 江戸川店',
      status: 'editing',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      code: '00003',
      name: '山田電気 銀座店',
      status: 'suspended',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
  ];

  return {
    data: stores,
    meta: {
      totalCount: 3,
      page: 1,
      size: 20,
    },
  } satisfies PaginatedResult<Store & { id: string }>;
}

/**
 * Controllerの期待値/返却値(data: Store+idの配列/ meta: totalCount/limit/offset)を作成
 */
function createExpectedStoreDto(): PaginatedStoreResponseDto {
  const stores: StoreResponseDto[] = [
    {
      id: 'b74d2683-7012-462c-b7d0-7e452ba0f1ab',
      code: '00001',
      name: '山田電気 赤羽店',
      status: 'published',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｱｶﾊﾞﾈｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都北区赤羽３丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '営業中',
      holidaysLabel: ['水', '日'],
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '70299537-4f16-435f-81ed-7bed4ae63758',
      code: '00002',
      name: '山田電気 江戸川店',
      status: 'editing',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｴﾄﾞｶﾞﾜｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都江戸川区西念1丁目10番地',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '編集中',
      holidaysLabel: ['水', '日'],
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
    {
      id: '1dfe32a5-ddac-4f3c-ad16-98e48a4dd63d',
      code: '00003',
      name: '山田電気 銀座店',
      status: 'suspended',
      email: 'yamada-akabane@test.co.jp',
      phoneNumber: '03-1122-9901',
      kanaName: 'ﾔﾏﾀﾞﾃﾞﾝｷ ｷﾞﾝｻﾞｼﾃﾝ',
      // prefecture: '東京都',
      holidays: ['WEDNESDAY', 'SUNDAY'],
      zipCode: '100-0001',
      address: '東京都中央区西銀座5丁目',
      businessHours: '10:00-20:00',
      createdAt: new Date('2025-04-05T10:00:00.000Z'),
      updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      statusLabel: '閉店',
      holidaysLabel: ['水', '日'],
      prefecture: {
        name: '東京都',
        code: '13',
        kanaName: 'トウキョウト',
        status: 'published',
        kanaEn: 'tokyo-to',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      },
    },
  ];

  return {
    data: stores,
    meta: {
      totalCount: 3,
      size: 20,
      page: 1,
    } satisfies PaginationMetaDto,
  } satisfies PaginatedStoreResponseDto;
}

/**
 * req: ExpressRequest & { user: RequestUser } をモックする。
 * ExpressRequest（通常は express の Request 型）にカスタムの user プロパティ（RequestUser 型）を
 * 追加したリクエストオブジェクトを模倣する必要があります。
 * → ExpressRequest と RequestUser を組み合わせた型を満たすようにモックを作成します。
 *
 */
function createRequest(): ExpressRequest & { user: RequestUser } {
  // RequestUserをモック:ペイロードの値
  const mockUser: RequestUser = {
    id: '633931d5-2b25-45f1-8006-c137af49e53d',
    name: 'テストユーザー',
    status: 'FREE',
  };

  // モックリクエスト（ExpressRequest & { user: RequestUser } を満たすデータを作成）
  // Partial<T>は、ユーティリティ型の一つで、指定した型Tのすべてのプロパティをオプション(任意)に
  // する型を生成します。
  // ExpressRequest（expressのRequest型を拡張した型）は、通常多くのプロパティ
  // （headers, query, bodyなど）を持っています。
  // テストではすべてのプロパティをモックする必要がないため、Partial<ExpressRequest>を使って
  // 必要なプロパティ（この場合はuser）だけを定義します。
  const mockRequest: Partial<ExpressRequest & { user: RequestUser }> = {
    user: mockUser,
  };
  // 型アサーションでキャスト（Partialで作成したmockRequestは実際の型(ExpressRequestを使っている)と
  // 完全に一致しないため、保守性がやや低下する可能性があるため）
  return mockRequest as ExpressRequest & { user: RequestUser };
}
