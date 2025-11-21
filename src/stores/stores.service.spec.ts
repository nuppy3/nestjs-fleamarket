import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { StoresService } from './stores.service';

// PrismaServiceのMock
const mockPrismaService = {
  store: {
    // fn()はmock関数(振る舞いはテスト実施時に指定)
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

// descrive():関連する複数のテストケースをグループ化
describe('StoresService Test', () => {
  // DIモジュール
  let storesService: StoresService;
  let prismaService: PrismaService;

  // 前処理: テスト全体の前に1回だけ実行される
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    //---------------------------------
    // @Module({
    //   imports: [PrismaModule],
    //   controllers: [StoresController],
    //   providers: [StoresService],
    // })
    //---------------------------------
    // TestクラスのcreateTestingModuleメソッドを使い、module(ItemService)のDIを実施
    // この便利なDIの仕組みはNestJSの仕組み。
    // 最後の.compile()を忘れずに
    const module = await Test.createTestingModule({
      // DI対象サービス
      providers: [
        StoresService,
        // PrismaServiceはmock(mockPrismaService)に切り替える
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    storesService = module.get<StoresService>(StoresService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // 前処理: 書くテストケースの前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('正常系', () => {});
  });

  describe('create', () => {
    it('正常系', () => {});
  });
});
