import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { RegionRepository } from './region.repository';

// MockService定義
const mockPrismaSercie = {
  region: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('□□□ Region Repository TEST □□□', () => {
  // DIモジュール
  let regionRepository: RegionRepository;
  let prismaService: PrismaService;
  // TODO 以下のようなPrisma mock方法もあるみたい。今度調べてみてもいい。
  // let prismaMock: DeepMockProxy<PrismaClient>;

  // 前処理 ： テスト全体の前に1回だけ実行
  beforeAll(async () => {
    console.log('beforeAll: モジュールのセットアップ（DIなど）');

    const module = await Test.createTestingModule({
      providers: [
        RegionRepository,
        { provide: PrismaService, useValue: mockPrismaSercie },
      ],
    }).compile();

    regionRepository = module.get<RegionRepository>(RegionRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  // 前処理: 各テストケース前に毎回実行
  beforeEach(() => {
    console.log('beforeEach: モックをリセット');
    jest.resetAllMocks();
  });

  //--------------------------------------
  // findByIdOrFail test
  //--------------------------------------
  describe('findByIdOrFail test', () => {
    it('正常系: Prismaデータ(Region)が正しく Region + id に変換されること', () => {});
  });
});
