import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma, Region as PrismaRegion } from 'generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { ReconstituteRegionProps, Region } from '../domain/regions.model';
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

  //--------------------------------------
  // save() test
  //--------------------------------------
  describe('save() test', () => {
    it('正常系: Regionデータ(全項目)が正しくPrismaに連携され、PrismaRegionが Region + id に変換されること', async () => {
      // prisma region 'update' mock data
      const mockPrismaRegion = {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道update',
        code: '77',
        kanaName: 'ほっかいどうあっぷでーと',
        status: 'published',
        kanaEn: 'hokkaidouupdate',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2026-04-15T12:30:00.000Z'),
        userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      } satisfies PrismaRegion;

      jest
        .spyOn(prismaService.region, 'update')
        .mockResolvedValue(mockPrismaRegion);

      // Repository引数作成: 更新対象のdomain (reconstituteでもcreateNewでもなんでもいい)
      const domain = Region.reconstitute({
        // id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道update',
        code: '77',
        kanaName: 'ほっかいどうあっぷでーと',
        status: 'published',
        kanaEn: 'hokkaidouupdate',
        // createdAtをセットしてもPrisaInputが作成されないこと
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2026-04-15T12:30:00.000Z'),
        // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      } satisfies ReconstituteRegionProps);
      const domainWithId = Object.assign(domain, {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
      });
      const userId = '633931d5-2b25-45f1-8006-c137af49e53d';

      // テスト対象のrepository呼び出し
      const result = await regionRepository.save(domainWithId, userId);

      // 期待値
      const expectedData = {
        id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道update',
        code: '77',
        kanaName: 'ほっかいどうあっぷでーと',
        status: 'published',
        kanaEn: 'hokkaidouupdate',
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2026-04-15T12:30:00.000Z'),
      };

      // Regionを完全カプセル化したことにより、getterなどのfunctionが含まれているので
      // toEqualでの完全一致比較だとNGになる。
      // 以下の検証だと、_codeとcode、_nameとnameでプロパティの名称でアンマッチが生じてしまう。。
      // expect(result).toMatchObject(expectedData);

      // Getterを通した値のチェック (toBeで個別で検証するパターン)
      expect(result.code).toBe(expectedData.code);
      expect(result.name).toBe(expectedData.name);
      expect(result.kanaName).toBe(expectedData.kanaName);
      expect(result.status).toBe(expectedData.status);
      expect(result.kanaEn).toBe(expectedData.kanaEn);
      expect(result.id).toBe(expectedData.id);

      // objectContaining()にてプレーンなオブジェクトでの比較検証を行うのが定石 パターン
      expect(result).toEqual(expect.objectContaining(expectedData));

      // 日付のチェック
      // ⭐️toBeは===と同等の比較になるが、オブジェクトのポインターの比較になるのでDateのミリ秒まで
      // 一致していたとしても、検証エラーになってしまう。
      // → toEqual()での検証、もしくは、result.createdAt.toString()、new Date('2025-04-05T10:00:00.000Z').toString()
      //   のように文字列変換して検証する。
      // <toBe と toEqual の違い>
      //    toBe: 「こいつらは同一人物か？（住所/参照が同じか）」
      //    toEqual: 「こいつらは同じ顔・形をしているか？（プロパティ/値が同じか）」
      expect(result.createdAt).toEqual(new Date('2025-04-05T10:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2026-04-15T12:30:00.000Z'));

      // インスタンス型のチェック
      expect(result).toBeInstanceOf(Region);

      // 引数検証用のパラメーター
      const inputParam = {
        code: domain.code,
        name: domain.name,
        kanaName: domain.kanaName,
        status: domain.status,
        kanaEn: domain.kanaEn,
        user: { connect: { id: userId } },
      } satisfies Prisma.RegionUpdateInput;

      // 引数検証
      expect(jest.spyOn(prismaService.region, 'update')).toHaveBeenCalledWith({
        data: inputParam,
        where: { id: 'b96509f2-0ba4-447c-8a98-473aa26e457a' },
      });
    });

    it('異常系: エラーのテスト: 元のエラーをそのまま伝搬(スロー)する', async () => {
      // serviceの引数作成
      const userId = 'xxxxxxxxxxxxxx';
      // Repository引数作成: 更新対象のdomain (reconstituteでもcreateNewでもなんでもいい)
      const domain = Region.reconstitute({
        // id: 'b96509f2-0ba4-447c-8a98-473aa26e457a',
        name: '北海道update',
        code: '77',
        kanaName: 'ほっかいどうあっぷでーと',
        status: 'published',
        kanaEn: 'hokkaidouupdate',
        // createdAtをセットしてもPrisaInputが作成されないこと
        createdAt: new Date('2025-04-05T10:00:00.000Z'),
        updatedAt: new Date('2026-04-15T12:30:00.000Z'),
        // userId: '633931d5-2b25-45f1-8006-c137af49e53d',
      } satisfies ReconstituteRegionProps);
      const domainWithId = Object.assign(domain, { id: 'xxxxxx' });

      // prisma mock data 作成:  Error
      const mockGenericError = new Error('Database connection failed');

      // mock data セット (Error)
      jest
        .spyOn(prismaService.region, 'update')
        .mockRejectedValue(mockGenericError);

      // 検証：NotFoundException
      await expect(regionRepository.save(domainWithId, userId)).rejects.toThrow(
        new Error('Database connection failed'),
      );
      // 元のエラー（Generic Error）がそのまま再スローされることをテスト
      // await expect(regionsService.create(dto, userId)).rejects.toThrow(Error);
      // await expect(regionsService.create(dto, userId)).rejects.toThrow(
      //   'Database connection failed',
      // );
    });
  });
});
