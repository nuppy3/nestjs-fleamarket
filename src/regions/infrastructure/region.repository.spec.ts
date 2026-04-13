import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Region as PrismaRegion } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { Region } from '../domain/regions.model';
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
    it('正常系: Prismaデータ(Region)が正しく Region + id に変換されること', async () => {
      // prisma region 'findUnique' mock data
      const mockPrismaRegion = {
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

      jest
        .spyOn(prismaService.region, 'findUnique')
        .mockResolvedValue(mockPrismaRegion);

      // Repository引数作成
      const id = 'b96509f2-0ba4-447c-8a98-473aa26e457a';

      // テスト対象のrepository呼び出し
      const result = await regionRepository.findByIdOrFail(id);

      // 期待値
      const expectedData = {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道',
        code: '01',
        kanaName: 'ほっかいどう',
        status: 'published',
        kanaEn: 'hokkaidou',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2025-04-05T12:30:00.000Z'),
      };

      // 検証: RegionドメインのtoEqual()の検証はしない（domainはプレーンオブジェクトではないため）
      // expect(result).toEqual(
      //   createExpectedData().find((region) => region.id === id),
      // );
      // 検証：プロパティをすべて持っているか、プロパティ値が正しいか
      expect(result).toMatchObject(expectedData);
      expect(result).toBeInstanceOf(Region);

      // 引数チェック
      expect(
        jest.spyOn(prismaService.region, 'findUnique'),
      ).toHaveBeenCalledWith({
        where: { id },
      });
    });
    it('異常系: idに関連するRegionが存在しない場合、NotFoundExceptionがスローされること', async () => {
      // serviceの引数作成
      const id = 'xxxx';
      // const userId = '633931d5-2b25-45f1-8006-c137af49e53d';

      // prisma mock data 作成: Regionが存在しない(null)
      jest.spyOn(prismaService.region, 'findUnique').mockResolvedValue(null);

      // ⭐️TODO ここは、Repositoryにてテストを行う
      // mock data 作成 (データ無し)
      // jest.spyOn(prismaService.region, 'findUnique').mockResolvedValue(null);

      // 検証：NotFoundException
      await expect(regionRepository.findByIdOrFail(id)).rejects.toThrow(
        new NotFoundException(
          `idに関連するエリア情報が存在しません!! regionId: ${id}`,
        ),
      );
    });
  });
});
