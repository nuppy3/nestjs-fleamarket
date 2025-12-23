import { Test } from '@nestjs/testing';
import { PrefecturesService } from '../prefectures/prefectures.service';
import { PrefecturesController } from './prefectures.controller';

const mockPrerectureService = {
  findAll: jest.fn(),
  create: jest.fn(),
};

describe('■■■ Prefectures Controller TEST ■■■', () => {
  // DI対象モジュール宣言
  let prefecturesContorller: PrefecturesController; // テスト対象
  let prefecturesService: PrefecturesService; // Controllerから呼ばれるService

  // servic mock data
  // let mockPrefectures:  ()
  // controller mock data(期待値)
  //

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

    prefecturesContorller = module.get<PrefecturesController>(
      PrefecturesController,
    );
    prefecturesService = module.get<PrefecturesService>(PrefecturesService);
    // service mock data

    // controller mock data(期待値)
  });

  // 各テストケースの前に毎回実行：こっちでcreateTestingModule()してもいいが、
  // 重いのでbeforeAll()で1回だけ実行するようにするのがベストプラクティス
  beforeEach(() => {
    console.log('beforeEach: モックをリセット jest.clearAllMocks()');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系：dto配列(全項目)が返却される(dtoは全て@Expose()がセットされている', () => {});
    it('正常系：取得データが０件、dto[]の空配列が返却される', () => {});
  });

  describe('create', () => {
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
    it('正常系：都道府県情報作成（DTOの全項目あり）し、DTO全項目を返却する', () => {});
  });
});
